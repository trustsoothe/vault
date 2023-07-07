import {
  Asset,
  Network,
  SupportedProtocols,
  VaultTeller,
} from "@poktscan/keyring";
import {
  ExtensionSessionStorage,
  ExtensionVaultStorage,
  ExtensionAssetStorage,
  ExtensionNetworkStorage,
} from "@poktscan/keyring-storage-extension";
import { WebEncryptionService } from "@poktscan/keyring-encryption-web";

console.log("recreating ExtensionVaultInstance");
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

export const ExtensionVaultInstance = new VaultTeller(
  new ExtensionVaultStorage(),
  new ExtensionSessionStorage(),
  new WebEncryptionService()
);

export const AssetStorage = new ExtensionAssetStorage();

export const NetworkStorage = new ExtensionNetworkStorage();

export const DefaultNetwork = new Network({
  name: "Pocket Mainnet",
  rpcUrl: "http://pokt.network.com/rpc",
  chainId: "mainnet",
  protocol: SupportedProtocols.POCKET_NETWORK,
});

export const DefaultAsset = new Asset({
  name: "POKT Token",
  symbol: "POKT",
  network: DefaultNetwork,
});
