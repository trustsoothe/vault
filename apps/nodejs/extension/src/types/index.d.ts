import type { SerializedAccountReference } from "@poktscan/keyring";
import type { Storage as OriginalStorage } from "webextension-polyfill/namespaces/storage";

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

interface AccountWithBalance extends SerializedAccountReference {
  balance?: number;
}
