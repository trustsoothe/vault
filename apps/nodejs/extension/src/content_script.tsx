import browser from "webextension-polyfill";
import ProxyCommunicationController from "./controllers/communication/Proxy";

const WORKER_KEEP_ALIVE_INTERVAL = 500;
const WORKER_KEEP_ALIVE_MESSAGE = "WORKER_KEEP_ALIVE_MESSAGE";
const TIME_45_MIN_IN_MS = 45 * 60 * 1000;

let keepAliveInterval;
let keepAliveTimer;

const sendMessageWorkerKeepAlive = () => {
  browser.runtime
    .sendMessage({ name: WORKER_KEEP_ALIVE_MESSAGE, date: new Date() })
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
