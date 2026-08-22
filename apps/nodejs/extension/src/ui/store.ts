import thunkMiddleware from "redux-thunk";
import browser from "webextension-polyfill";
import { applyMiddleware, Store } from "webext-redux";
import {
  DEFAULT_PORT_NAME,
  PATCH_STATE_TYPE,
  STATE_TYPE,
} from "webext-redux/lib/constants";
import { balanceApi } from "../redux/slices/balance";
import { pricesApi } from "../redux/slices/prices";
import { wpoktApi } from "../redux/slices/wpokt";
import { poktApi } from "../redux/slices/pokt";

/** dispatched on window when the connection with the background store was re-established */
export const STORE_RECONNECTED_EVENT = "soothe:store-reconnected";

const RECONNECT_DELAY_MS = 250;

/**
 * webext-redux's Store opens one port to the background and never reconnects.
 * In MV3 the background service worker gets terminated (idle, sleep/wake,
 * memory pressure, extension update...): the port dies, the page keeps its
 * last state snapshot and, although dispatches still wake the worker, the
 * state patches never come back, so balances (and everything else) look
 * frozen until the page is reloaded.
 *
 * This store watches the port and, when it disconnects, opens a new one and
 * re-attaches the state listeners; the background answers a new connection
 * with its full state, which replaces the stale snapshot.
 */
class ReconnectingStore extends Store {
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    super();
    this.watchPort();
  }

  private get currentPort(): browser.Runtime.Port {
    return (this as any).port;
  }

  private watchPort() {
    this.currentPort.onDisconnect.addListener(() => {
      if (this.reconnectTimer) return;
      this.reconnectTimer = setTimeout(() => {
        this.reconnectTimer = null;
        this.reconnect();
      }, RECONNECT_DELAY_MS);
    });
  }

  private reconnect() {
    try {
      (this as any).port = browser.runtime.connect(undefined, {
        name: DEFAULT_PORT_NAME,
      });
    } catch (e) {
      // the extension itself was reloaded/updated: this page's context is
      // gone for good, a reload is the only way to get a working one
      console.warn("Could not reconnect to the background store, reloading", e);
      window.location.reload();
      return;
    }

    // same handling as the one webext-redux installs in its constructor
    (this as any).serializedPortListener(
      (message: { type: string; payload: any }) => {
        switch (message.type) {
          case STATE_TYPE:
            this.replaceState(message.payload);
            window.dispatchEvent(new Event(STORE_RECONNECTED_EVENT));
            break;
          case PATCH_STATE_TYPE:
            this.patchState(message.payload);
            break;
        }
      }
    );

    this.watchPort();
  }
}

let store: Store;

export default function getStore() {
  if (store) {
    return store;
  }

  const newStore = new ReconnectingStore();
  const storeWithMiddleware = applyMiddleware(
    newStore,
    thunkMiddleware,
    // this middleware is a fix for firefox and the rtk queries, because Store complains about not being able to clone objects
    (_) => (next) => (action) => {
      return next(JSON.parse(JSON.stringify(action)));
    },
    // @ts-ignore
    wpoktApi.middleware,
    pricesApi.middleware,
    balanceApi.middleware,
    poktApi.middleware
  );
  Object.assign(storeWithMiddleware, {
    dispatch: storeWithMiddleware.dispatch.bind(storeWithMiddleware),
    getState: storeWithMiddleware.getState.bind(storeWithMiddleware),
    subscribe: storeWithMiddleware.subscribe.bind(storeWithMiddleware),
  });

  return (store = storeWithMiddleware);
}
