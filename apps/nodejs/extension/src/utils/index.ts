import { VaultTeller } from "@poktscan/keyring";
import {
  ExtensionSessionStorage,
  ExtensionVaultStorage,
  ExtensionAssetStorage,
  ExtensionNetworkStorage,
} from "@poktscan/keyring-storage-extension";
import { WebEncryptionService } from "@poktscan/keyring-encryption-web";

let extensionVaultInstance: VaultTeller;

export const getVault = (): VaultTeller => {
  if (extensionVaultInstance) {
    return extensionVaultInstance;
  }

  return (extensionVaultInstance = new VaultTeller(
    new ExtensionVaultStorage(),
    new ExtensionSessionStorage(),
    new WebEncryptionService()
  ));
};

export const AssetStorage = new ExtensionAssetStorage();

export const NetworkStorage = new ExtensionNetworkStorage();

export const isHex = (str: string) => {
  return str.match(/^[0-9a-fA-F]+$/g);
};

export const byteLength = (str: string) => new Blob([str]).size;
