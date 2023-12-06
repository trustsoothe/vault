import browser from "webextension-polyfill";
import { wrapStore } from "webext-redux";
import store, { RootState } from "./redux/store";
import InternalCommunicationController from "./controllers/communication/Internal";
import ExternalCommunicationController from "./controllers/communication/External";
import {
  changeActiveTab,
  loadSelectedNetworkAndAccount,
  setAppIsReadyStatus,
} from "./redux/slices/app";
import {
  loadAssetsFromCdn,
  loadAssetsFromStorage,
  loadNetworksFromCdn,
  loadNetworksFromStorage,
} from "./redux/slices/app/network";
import { getVault } from "./utils";
import { lockVault } from "./redux/slices/vault";
import { UnknownError } from "./errors/communication";

wrapStore(store);

async function createOffscreen() {
  // @ts-ignore
  await browser.offscreen
    .createDocument({
      url: "offscreen.html",
      reasons: ["BLOBS"],
      justification: "keep service worker running",
    })
    .catch(() => {});
}

browser.runtime.onStartup.addListener(createOffscreen);
self.onmessage = () => {}; // keepAlive
createOffscreen().catch();

browser.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    browser.tabs
      .create({
        active: true,
        url: "home.html",
      })
      .catch();
  }
});

// todo: create controller or function
browser.tabs.onActivated.addListener((activeInfo) => {
  browser.tabs.get(activeInfo.tabId).then((tab) => {
    store.dispatch(
      changeActiveTab({ id: tab.id, url: tab.url, favIconUrl: tab.favIconUrl })
    );
  });
});

browser.tabs.onUpdated.addListener((activeInfo) => {
  browser.tabs.get(activeInfo).then((tab) => {
    const activeTab = store.getState().app.activeTab;

    if (activeTab && activeTab.id === tab.id) {
      store.dispatch(
        changeActiveTab({
          id: tab.id,
          url: tab.url,
          favIconUrl: tab.favIconUrl,
        })
      );
    }
  });
});

const internal = new InternalCommunicationController();
const external = new ExternalCommunicationController();

const answerAppIsReadyRequest = async () => {
  const status = store.getState().app.isReadyStatus;

  if (status === "yes") {
    return {
      type: "APP_IS_READY_RESPONSE",
      data: {
        isReady: true,
        chainByProtocol: store.getState().app.selectedChainByProtocol,
      },
      error: null,
    };
  }

  const makeAppReady = async () => {
    try {
      await initializeExtension();

      return {
        type: "APP_IS_READY_RESPONSE",
        data: {
          isReady: true,
          chainByProtocol: store.getState().app.selectedChainByProtocol,
        },
        error: null,
      };
    } catch (e) {
      return {
        type: "APP_IS_READY_RESPONSE",
        data: null,
        error: UnknownError,
      };
    }
  };

  if (status === "loading") {
    return await new Promise((resolve) => {
      const unsubscribe = store.subscribe(async () => {
        const newStatus = store.getState().app.isReadyStatus;
        if (newStatus !== "loading") {
          if (newStatus === "no") {
            resolve(await makeAppReady());
          } else {
            resolve({
              type: "APP_IS_READY_RESPONSE",
              data: {
                isReady: true,
                chainByProtocol: store.getState().app.selectedChainByProtocol,
              },
              error: null,
            });
          }
          unsubscribe();
        }
      });
    });
  }

  return await makeAppReady();
};

browser.runtime.onMessage.addListener(async (message, sender) => {
  if (message?.type === "APP_IS_READY_REQUEST") {
    return answerAppIsReadyRequest();
  }

  if (message?.type === "WAIT_BACKGROUND") {
    return "INIT";
  }

  const responses = await Promise.all([
    internal.onMessageHandler(message, sender),
    external.onMessageHandler(message, sender),
  ]);

  for (const respond of responses) {
    if (respond) {
      return respond;
    }
  }

  return {
    type: "UNKNOWN",
  };
});

async function initializeExtension() {
  try {
    store.dispatch(setAppIsReadyStatus("loading"));
    await Promise.all([
      store.dispatch(loadNetworksFromStorage()).unwrap(),
      store.dispatch(loadAssetsFromStorage()).unwrap(),
    ]);
    await Promise.allSettled([
      store.dispatch(loadNetworksFromCdn()),
      store.dispatch(loadAssetsFromCdn()),
    ]);
    await store.dispatch(loadSelectedNetworkAndAccount()).unwrap();
    store.dispatch(setAppIsReadyStatus("yes"));
  } catch (e) {
    console.error("ERROR TRYING TO INIT EXTENSION STATE:", e);
    store.dispatch(setAppIsReadyStatus("error"));
  }
}

(async () => {
  await initializeExtension();

  setInterval(async () => {
    await Promise.all([
      store.dispatch(loadNetworksFromCdn()),
      store.dispatch(loadAssetsFromCdn()),
    ]);
    await store.dispatch(loadSelectedNetworkAndAccount());
  }, 1000 * 60 * 20);

  setInterval(async () => {
    const state = store.getState() as RootState;

    const sessionId = state?.vault?.vaultSession?.id;

    if (sessionId) {
      const vault = getVault();
      const isSessionValid = await vault.isSessionValid(sessionId);

      if (!isSessionValid) {
        store.dispatch(lockVault());
      }
    }
  }, 5 * 1000);
})().catch();
