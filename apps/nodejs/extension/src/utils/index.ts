import type { Protocol } from "@poktscan/keyring/dist/lib/core/common/Protocol";
import type { TProtocol } from "../controllers/communication/Proxy";
import {
  ForbiddenSessionError,
  InvalidSessionError,
  SerializedAsset,
  SessionNotFoundError,
  VaultTeller,
} from "@poktscan/keyring";
import {
  ExtensionSessionStorage,
  ExtensionVaultStorage,
  ExtensionAssetStorage,
  ExtensionNetworkStorage,
} from "@poktscan/keyring-storage-extension";
import { WebEncryptionService } from "@poktscan/keyring-encryption-web";
import {
  ForbiddenSession,
  InvalidSession,
  UnknownError,
} from "../errors/communication";

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

export const getAssetByProtocol = (
  assets: SerializedAsset[],
  protocol: TProtocol | Protocol
) =>
  assets.find(
    (item) =>
      item.protocol.name === protocol.name &&
      item.protocol.chainID === protocol.chainID
  );

export const returnExtensionErr = <T extends string>(
  error: Error,
  responseType: T
) => {
  if (error instanceof SessionNotFoundError) {
    return {
      type: responseType,
      error: InvalidSession,
      data: null,
    };
  }

  if (error instanceof InvalidSessionError) {
    return {
      type: responseType,
      error: InvalidSession,
      data: null,
    };
  }

  if (error instanceof ForbiddenSessionError) {
    return {
      type: responseType,
      error: ForbiddenSession,
      data: null,
    };
  }

  return {
    type: responseType,
    error: UnknownError,
    data: null,
  };
};
