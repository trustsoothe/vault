import { AnyAction, configureStore, ThunkDispatch } from "@reduxjs/toolkit";
import vaultSliceReducer, { checkInitializeStatus } from "./slices/vault";
import generalAppReducer from "./slices/app";

const store = configureStore({
  reducer: {
    vault: vaultSliceReducer,
    app: generalAppReducer,
  },
  middleware: (getDefaultMiddleware) => {
    return getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["vault/unlockVault/fulfilled"],
        ignoredActionPaths: ["payload"],
        ignoredPaths: ["vault.session"],
      },
    });
  },
});

// 1. Get the root state's type from reducers
export type RootState = ReturnType<typeof store.getState>;

// 2. Create a type for thunk dispatch
export type AppDispatch = ThunkDispatch<RootState, any, AnyAction>;

export default store;

store.dispatch(checkInitializeStatus());
