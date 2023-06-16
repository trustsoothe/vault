import type {
  IVaultStore,
  EncryptedVault,
  SerializedEncryptedVault,
} from "@poktscan/keyring";
import * as browser from "webextension-polyfill";

export class ExtensionVaultStorage implements IVaultStore {
  constructor(private readonly vaultPath: string) {}

  async get(): Promise<EncryptedVault | null> {
    try {
      const resultMap = await browser.storage.local.get({
        [this.vaultPath]: null,
      });
      /*
         TODO: Validate the result is a valid EncryptedVault
      */
      return resultMap[this.vaultPath];
    } catch (error) {
      return null;
    }
  }

  async save(vault: SerializedEncryptedVault): Promise<void> {
    return browser.storage.local.set({ [this.vaultPath]: vault });
  }
}
