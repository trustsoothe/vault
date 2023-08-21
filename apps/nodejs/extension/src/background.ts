import browser from "webextension-polyfill";
import { wrapStore } from "webext-redux";
import store from "./redux/store";
import InternalCommunicationController from "./controllers/communication/Internal";
import ExternalCommunicationController from "./controllers/communication/External";

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
self.onmessage = (e) => {}; // keepAlive
createOffscreen();

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

const WORKER_KEEP_ALIVE_MESSAGE = "WORKER_KEEP_ALIVE_MESSAGE";

const internal = new InternalCommunicationController();
const external = new ExternalCommunicationController();

browser.runtime.onMessage.addListener(async (message, sender) => {
  if (message?.name === WORKER_KEEP_ALIVE_MESSAGE) {
    return {
      name: "ACK_KEEP_ALIVE_MESSAGE",
      date: new Date(),
    };
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

class TestC {
  constructor() {
    const currentDate = new Date();
    console.log("created new instance of TestC at:", currentDate);

    // @ts-ignore
    (browser.storage.session as typeof browser.storage.local)
      .get({ previous_date: null })
      .then((result) => {
        console.log("previous saved date:", result["previous_date"]);

        // @ts-ignore
        (browser.storage.session as typeof browser.storage.local)
          .set({
            previous_date: currentDate.toString(),
          })
          .catch((e) => console.log(e));
      });
  }
}

const testInstance = new TestC();
