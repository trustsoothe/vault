import { AnyAction, configureStore, ThunkDispatch } from "@reduxjs/toolkit";
import vaultSliceReducer from "./slices/vault";
import generalAppReducer from "./slices/app";
import { pricesApi } from "./slices/prices";
import { wpoktApi } from "./slices/wpokt";

const store = configureStore({
  reducer: {
    vault: vaultSliceReducer,
    app: generalAppReducer,
    [pricesApi.reducerPath]: pricesApi.reducer,
    [wpoktApi.reducerPath]: wpoktApi.reducer,
  },
  middleware: (getDefaultMiddleware) => {
    return getDefaultMiddleware({
      serializableCheck: false,
    });
  },
});

// 1. Get the root state's type from reducers
export type RootState = ReturnType<typeof store.getState>;

// 2. Create a type for thunk dispatch
export type AppDispatch = ThunkDispatch<RootState, any, AnyAction>;

export default store;
