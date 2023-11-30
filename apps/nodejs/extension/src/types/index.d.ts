import type { ActionReducerMapBuilder } from "@reduxjs/toolkit";
import type { SerializedAccountReference } from "@poktscan/keyring";
import type { Storage as OriginalStorage } from "webextension-polyfill/namespaces/storage";
import type {
  ProxyCheckConnectionRequest,
  ProxyConnectionRequest,
  ProxyConnectionRes,
  ProxyDisconnectRequest,
  ProxyDisconnectRes,
  ProxyListAccountsRequest,
  ProxyListAccountsRes,
  ProxyNewAccountRequest,
  ProxyNewAccountRes,
  ProxyTransferRequest,
  ProxyTransferRes,
} from "./communication";
import type { ArgsOrCallback, Method, MethodOrPayload } from "./provider";
import type { GeneralAppSlice } from "../redux/slices/app";
import type { VaultSlice } from "../redux/slices/vault";

export type AppSliceBuilder = ActionReducerMapBuilder<GeneralAppSlice>;
export type VaultSliceBuilder = ActionReducerMapBuilder<VaultSlice>;

interface SessionStorage extends OriginalStorage.StorageArea {
  /**
   * The maximum amount (in bytes) of data that can be stored in local storage, as measured by the
   * JSON stringification of every value plus every key's length.
   */
  QUOTA_BYTES: 10485760;
}

declare module "webextension-polyfill" {
  namespace Storage {
    interface Static {
      session: SessionStorage;
    }
  }
}

declare global {
  interface Window {
    pocketNetwork: {
      send: (
        methodOrPayload: MethodOrPayload,
        argsOrCallback?: ArgsOrCallback
      ) => unknown;
      request: (args: Method) => unknown;
      isSoothe: true;
    };
    soothe: {
      connect: () => Promise<ProxyConnectionRes["data"]>;
      disconnect: () => Promise<ProxyDisconnectRes["data"]>;
      checkConnection: () => Promise<ProxyConnectionRes["data"]>;
      listAccounts: () => Promise<ProxyListAccountsRes["data"]>;
      createAccount: (
        data: ProxyNewAccountRequest["data"]
      ) => Promise<ProxyNewAccountRes["data"]>;
      suggestTransfer: (
        data: ProxyTransferRequest["data"]
      ) => Promise<ProxyTransferRes["data"]>;
    };
  }
}

interface AccountWithBalance extends SerializedAccountReference {
  balance?: number;
}

export type BrowserRequest =
  | ProxyConnectionRequest
  | ProxyCheckConnectionRequest
  | ProxyNewAccountRequest
  | ProxyTransferRequest
  | ProxyDisconnectRequest
  | ProxyListAccountsRequest;

export type BrowserResponse =
  | ProxyConnectionRes
  | ProxyListAccountsRes
  | ProxyDisconnectRes
  | ProxyNewAccountRes
  | ProxyTransferRes;
