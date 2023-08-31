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

const internal = new InternalCommunicationController();
const external = new ExternalCommunicationController();

browser.runtime.onMessage.addListener(async (message, sender) => {
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
