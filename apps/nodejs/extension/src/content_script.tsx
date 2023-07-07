import browser from "webextension-polyfill";
import { Store } from "webext-redux";
import { CONNECTION_REQUEST_MESSAGE } from "./constants/communication";
import ProxyCommunicationController from "./controllers/communication/Proxy";

const WORKER_KEEP_ALIVE_INTERVAL = 500;
const WORKER_KEEP_ALIVE_MESSAGE = "WORKER_KEEP_ALIVE_MESSAGE";
const TIME_45_MIN_IN_MS = 45 * 60 * 1000;

let keepAliveInterval;
let keepAliveTimer;

const sendMessageWorkerKeepAlive = () => {
  browser.runtime
    .sendMessage({ name: WORKER_KEEP_ALIVE_MESSAGE })
    .then((result) => {
      // console.log("keep alive message was sent. Received:", result);
    })
    .catch((e) => {
      console.log(e);
    });
};

const runWorkerKeepAliveInterval = () => {
  clearTimeout(keepAliveTimer);

  keepAliveTimer = setTimeout(() => {
    clearInterval(keepAliveInterval);
  }, TIME_45_MIN_IN_MS);

  clearInterval(keepAliveInterval);

  sendMessageWorkerKeepAlive();

  keepAliveInterval = setInterval(() => {
    if (browser.runtime.id) {
      sendMessageWorkerKeepAlive();
    }
  }, WORKER_KEEP_ALIVE_INTERVAL);
};

runWorkerKeepAliveInterval();

const proxy = new ProxyCommunicationController();

// browser.runtime.onMessage.addListener(async function (msg, sender) {
//   console.log("message received", msg);
//
//   if (msg.color) {
//     console.log("Receive color = " + msg.color);
//     document.body.style.backgroundColor = msg.color;
//     return "Change color to " + msg.color;
//   } else {
//     return "Color message is none.";
//   }
//
//   return "received";
// });
//
// window.addEventListener("message", async (event) => {
//   if (event.data?.type === "hello") {
//     let faviconUrl: string;
//     const faviconFromSelector: HTMLAnchorElement = document.querySelector(
//       "link[rel*='icon']"
//     );
//
//     if (faviconFromSelector) {
//       faviconUrl = faviconFromSelector.href;
//     }
//
//     const response = await browser.runtime.sendMessage({
//       type: CONNECTION_REQUEST_MESSAGE,
//       data: {
//         origin: event.origin,
//         faviconUrl,
//       },
//     });
//
//     console.log(response);
//   }
//
//   if (event.data?.type === "ext_response") {
//     console.log("response from extension received:", event.data);
//   }
// });
