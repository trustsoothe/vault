import browser from "webextension-polyfill";
import { wrapStore } from "webext-redux";
import store from "./redux/store";
import InternalCommunicationController from "./controllers/communication/Internal";
import ExternalCommunicationController from "./controllers/communication/External";

wrapStore(store);

browser.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    browser.tabs
      .create({
        active: true,
        url: "home.html",
      })
      .then(() => {
        console.log("home page opened");
      });
  }
});

const WORKER_KEEP_ALIVE_MESSAGE = "WORKER_KEEP_ALIVE_MESSAGE";

const internal = new InternalCommunicationController();
const external = new ExternalCommunicationController();

browser.runtime.onMessage.addListener(async (message, sender) => {
  if (message?.name === WORKER_KEEP_ALIVE_MESSAGE) {
    return "ACK_KEEP_ALIVE_MESSAGE";
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
