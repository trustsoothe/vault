import React from "react";
import { Provider } from "react-redux";
import browser from "webextension-polyfill";
import { createRoot } from "react-dom/client";
import { APP_IS_READY_REQUEST } from "./constants/communication";
import getStore from "./ui/store";
import App from "./ui";

const store = getStore();

// to only display the UI when the servicer worker is activated and avoid blank UI
browser.runtime.sendMessage({ type: APP_IS_READY_REQUEST }).then(() => {
  store.ready().then(() => {
    const root = createRoot(document.getElementById("root")!);

    root.render(
      <Provider store={store}>
        <App />
      </Provider>
    );
  });
});
