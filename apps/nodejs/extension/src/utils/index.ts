import {
  ForbiddenSessionErrorName,
  InvalidSessionErrorName,
  SessionNotFoundErrorName,
  SerializedAsset,
  SupportedProtocols,
  VaultTeller,
} from "@poktscan/keyring";
import {
  ExtensionAssetStorage,
  ExtensionNetworkStorage,
  ExtensionSessionStorage,
  ExtensionVaultStorage,
} from "@poktscan/keyring-storage-extension";
import { WebEncryptionService } from "@poktscan/keyring-encryption-web";
import { UnauthorizedError, UnknownError } from "../errors/communication";

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

export const getAssetByProtocol = (
  assets: SerializedAsset[],
  protocol: SupportedProtocols
) => assets.find((item) => item.protocol === protocol);

export const returnExtensionErr = <T extends string>(
  error: Error,
  responseType: T
) => {
  if (
    [
      ForbiddenSessionErrorName,
      InvalidSessionErrorName,
      SessionNotFoundErrorName,
    ].includes(error?.name)
  ) {
    return {
      type: responseType,
      error: UnauthorizedError,
      data: null,
    };
  }

  return {
    type: responseType,
    error: UnknownError,
    data: null,
  };
};

export const verifyPassword = (password: string): true => {
  if (!password) {
    throw new Error("Required");
  }

  if (password.length < 8) {
    throw new Error("Should have at least 8 characters.");
  }
  return true;
};

export const generateRandomPassword = (passwordLength = 12): string => {
  const chars =
    "0123456789abcdefghijklmnopqrstuvwxyz!@#$%^&*()ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let password = "";

  for (let i = 0; i <= passwordLength; i++) {
    const randomNumber = Math.floor(Math.random() * chars.length);
    password += chars.substring(randomNumber, randomNumber + 1);
  }

  try {
    verifyPassword(password);
  } catch (e) {
    return generateRandomPassword(passwordLength);
  }

  return password;
};

export const wait = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));
