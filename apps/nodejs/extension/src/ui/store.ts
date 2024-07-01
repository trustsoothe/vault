import thunkMiddleware from "redux-thunk";
import { applyMiddleware, Store } from "webext-redux";
import { pricesApi } from "../redux/slices/prices";
import { wpoktApi } from "../redux/slices/wpokt";

export default function getStore() {
  const store = new Store();
  const storeWithMiddleware = applyMiddleware(
    store,
    thunkMiddleware,
    // this middleware is a fix for firefox and the rtk queries, because Store complains about not being able to clone objects
    (_) => (next) => (action) => {
      return next(JSON.parse(JSON.stringify(action)));
    },
    wpoktApi.middleware,
    pricesApi.middleware
  );
  Object.assign(storeWithMiddleware, {
    dispatch: storeWithMiddleware.dispatch.bind(storeWithMiddleware),
    getState: storeWithMiddleware.getState.bind(storeWithMiddleware),
    subscribe: storeWithMiddleware.subscribe.bind(storeWithMiddleware),
  });

  return storeWithMiddleware;
}
