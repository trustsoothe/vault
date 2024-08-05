import { AnyAction, configureStore, ThunkDispatch } from "@reduxjs/toolkit";
import vaultSliceReducer from "./slices/vault";
import { balanceApi } from "./slices/balance";
import generalAppReducer from "./slices/app";
import { pricesApi } from "./slices/prices";
import { wpoktApi } from "./slices/wpokt";

const store = configureStore({
  reducer: {
    vault: vaultSliceReducer,
    app: generalAppReducer,
    [pricesApi.reducerPath]: pricesApi.reducer,
    [wpoktApi.reducerPath]: wpoktApi.reducer,
    [balanceApi.reducerPath]: balanceApi.reducer,
  },
  // we are not passing all middlewares here, because we are already setting them in the UI store
  // and placing them here would cause to execute the queries twice
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(pricesApi.middleware),
});

// 1. Get the root state's type from reducers
export type RootState = ReturnType<typeof store.getState>;

// 2. Create a type for thunk dispatch
export type AppDispatch = ThunkDispatch<RootState, any, AnyAction>;

export default store;
