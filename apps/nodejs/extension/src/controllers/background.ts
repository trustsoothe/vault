import MessageSender = Runtime.MessageSender;
import OnInstalledDetailsType = Runtime.OnInstalledDetailsType;
import OnActivatedActiveInfoType = Tabs.OnActivatedActiveInfoType;
import browser, { Runtime, Tabs } from "webextension-polyfill";
import { UnknownError } from "../errors/communication";
import {
  loadAssetsFromCdn,
  loadAssetsFromStorage,
  loadNetworksFromCdn,
  loadNetworksFromStorage,
} from "../redux/slices/app/network";
import {
  APP_IS_READY_REQUEST,
  APP_IS_READY_RESPONSE,
} from "../constants/communication";
import {
  changeActiveTab,
  loadSelectedNetworkAndAccount,
  setAppIsReadyStatus,
} from "../redux/slices/app";
import { getVault } from "../utils";
import { lockVault } from "../redux/slices/vault";
import store, { RootState } from "../redux/store";
import InternalCommunicationController from "./communication/Internal";
import ExternalCommunicationController from "./communication/External";
import { AppIsReadyResponse } from "../types/communication";

export default class BackgroundController {
  private readonly internal = new InternalCommunicationController();
  private readonly external = new ExternalCommunicationController();

  constructor() {
    this._setOffScreen();
    this._initializeExtension().catch();

    browser.tabs.onUpdated.addListener(this._onTabUpdated.bind(this));
    browser.tabs.onActivated.addListener(this._onTabActivated.bind(this));
    browser.runtime.onMessage.addListener(
      this._handleMessageRequest.bind(this)
    );
    browser.runtime.onInstalled.addListener(
      this._onExtensionInstalled.bind(this)
    );
  }

  /** To enable offscreen and keep the service worker active */
  private _setOffScreen() {
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
  }

  /** To open extension page after install to allow the user to initialize their vault */
  private _onExtensionInstalled(details: OnInstalledDetailsType) {
    if (details.reason === "install") {
      browser.tabs
        .create({
          active: true,
          url: "home.html",
        })
        .catch();
    }
  }

  /** To save in state the active tab */
  private _onTabActivated(activeInfo: OnActivatedActiveInfoType) {
    browser.tabs.get(activeInfo.tabId).then((tab) => {
      store.dispatch(
        changeActiveTab({
          id: tab.id,
          url: tab.url,
          favIconUrl: tab.favIconUrl,
        })
      );
    });
  }

  /** To save in state the active tab */
  private _onTabUpdated(tabId: number) {
    browser.tabs
      .get(tabId)
      .then((tab) => {
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
      })
      .catch();
  }

  /** To response UI and provider messages. There can only be on onMessage listener to avoid wrong responses */
  private async _handleMessageRequest(message, sender: MessageSender) {
    if (message?.type === APP_IS_READY_REQUEST) {
      return this._answerAppIsReadyRequest();
    }

    const controllers = [this.internal, this.external];

    for (const controller of controllers) {
      if (controller.messageForController(message?.type)) {
        return controller.onMessageHandler(message, sender);
      }
    }

    return {
      type: "UNKNOWN",
    };
  }

  private async _answerAppIsReadyRequest(): Promise<AppIsReadyResponse> {
    const status = store.getState().app.isReadyStatus;

    if (status === "yes") {
      return {
        type: APP_IS_READY_RESPONSE,
        data: {
          isReady: true,
          chainByProtocol: store.getState().app.selectedChainByProtocol,
        },
        error: null,
      };
    }

    const makeAppReady = async (): Promise<AppIsReadyResponse> => {
      try {
        await this._initializeExtensionState();

        return {
          type: APP_IS_READY_RESPONSE,
          data: {
            isReady: true,
            chainByProtocol: store.getState().app.selectedChainByProtocol,
          },
          error: null,
        };
      } catch (e) {
        return {
          type: APP_IS_READY_RESPONSE,
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
                type: APP_IS_READY_RESPONSE,
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
  }

  private async _initializeExtensionState() {
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

  private async _initializeExtension() {
    await this._initializeExtensionState();

    setInterval(async () => {
      await Promise.all([
        store.dispatch(loadNetworksFromCdn()),
        store.dispatch(loadAssetsFromCdn()),
      ]);
      await store.dispatch(loadSelectedNetworkAndAccount());
      // every 20 minutes
    }, 1000 * 60 * 20);

    // check if vault session is still valid
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
      // every 5 seconds
    }, 5 * 1000);
  }
}
