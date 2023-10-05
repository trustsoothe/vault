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
    soothe: {
      connect: () => Promise<ProxyConnectionRes>;
      disconnect: () => Promise<ProxyDisconnectRes>;
      checkConnection: () => Promise<ProxyConnectionRes>;
      listAccounts: () => Promise<ProxyListAccountsRes>;
      createAccount: (
        data: ProxyNewAccountRequest["data"]
      ) => Promise<ProxyNewAccountRes>;
      suggestTransfer: (
        data: ProxyTransferRequest["data"]
      ) => Promise<ProxyTransferRes>;
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
