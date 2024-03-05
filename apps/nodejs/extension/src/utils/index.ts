import { generate } from "random-words";
import {
  ForbiddenSessionErrorName,
  InvalidSessionErrorName,
  SessionNotFoundErrorName,
  SerializedAsset,
  SupportedProtocols,
  VaultTeller,
} from "@soothe/vault";
import {
  ExtensionAssetStorage,
  ExtensionNetworkStorage,
  ExtensionSessionStorage,
  ExtensionVaultStorage,
} from "@soothe/vault-storage-extension";
import { WebEncryptionService } from "@soothe/vault-encryption-web";
import {
  UnauthorizedError,
  UnauthorizedErrorSessionInvalid,
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

export const getAssetByProtocol = (
  assets: SerializedAsset[],
  protocol: SupportedProtocols
) => assets.find((item) => item.protocol === protocol);

export const returnExtensionErr = <T extends string>(
  error: Error,
  responseType: T
) => {
  if (error?.name === InvalidSessionErrorName) {
    return {
      type: responseType,
      error: UnauthorizedErrorSessionInvalid,
      data: null,
    };
  }

  if (
    [ForbiddenSessionErrorName, SessionNotFoundErrorName].includes(error?.name)
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

export const generateRandomPassword = (
  passwordLength = 12,
  words = false
): string => {
  const chars =
    "0123456789abcdefghijklmnopqrstuvwxyz!@#$%^&*()ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let password = "";

  if (words) {
    password = generate({ minLength: 4, exactly: passwordLength, join: " " });
  } else {
    for (let i = 0; i <= passwordLength; i++) {
      const randomNumber = Math.floor(Math.random() * chars.length);
      password += chars.substring(randomNumber, randomNumber + 1);
    }
  }

  try {
    verifyPassword(password);
  } catch (e) {
    return generateRandomPassword(passwordLength);
  }

  return password;
};

export const generateRecoveryPhrase = (size = 12) => {
  const vault = getVault();

  return vault.createRecoveryPhrase(size);
};

export const recoveryPhraseIsValid = (phrase: string) => {
  const vault = getVault();

  return vault.validateRecoveryPhrase(phrase);
};

export const wait = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));
