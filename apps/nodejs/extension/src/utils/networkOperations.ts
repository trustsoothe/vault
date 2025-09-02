import type { CustomRPC, ErrorsByNetwork, Network } from "../redux/slices/app";
import { Buffer } from "buffer";
import {
  createDecipheriv,
  randomBytes,
  createCipheriv,
} from "crypto-browserify";
import { scrypt } from "ethereum-cryptography/scrypt.js";
import { isAddress as isEthAddress, validator } from "web3-validator";
import { decrypt, encrypt, keyStoreSchema } from "web3-eth-accounts";
import {
  INetwork,
  PocketNetworkProtocolService,
  ProtocolServiceFactory,
  SupportedProtocols,
} from "@soothe/vault";
import { WebEncryptionService } from "@soothe/vault-encryption-web";
import { isPocketAddress, isShannonAddress } from "./proxy";

export function convertErrorToJson(error: unknown) {
  if (error instanceof Error) {
    const result: Record<string, any> = {
      name: error.name,
      message: error.message,
      stack: error.stack,
      cause: error.cause,
    };

    // Copy all enumerable properties
    for (const key in error) {
      if (error.hasOwnProperty(key)) {
        result[key] = (error as any)[key];
      }
    }

    // Also check for specific known properties that might be non-enumerable
    if ("rpcUrl" in error) {
      result.rpcUrl = (error as any).rpcUrl;
    }
    if ("originalError" in error) {
      result.originalError = (error as any).originalError;
    }

    return result;
  }

  if (typeof error === "object" && error !== null) {
    try {
      return error; // Return the object directly, let the outer JSON.stringify handle it
    } catch {
      return String(error);
    }
  }

  return String(error);
}

export const isValidAddress = (
  address: string,
  protocol: SupportedProtocols
) => {
  const fn = (() => {
    switch (protocol) {
      case SupportedProtocols.Pocket:
        return isPocketAddress;
      case SupportedProtocols.Ethereum:
        return isEthAddress;
      case SupportedProtocols.Cosmos:
        return isShannonAddress;
    }
  })();

  return fn(address);
};

export const isValidPrivateKey = (
  privateKey: string,
  protocol: SupportedProtocols
) => {
  return ProtocolServiceFactory.getProtocolService(
    protocol,
    null
  ).isValidPrivateKey(privateKey);
};

export const isNetworkUrlHealthy = async (network: INetwork) => {
  try {
    const ProtocolService = ProtocolServiceFactory.getProtocolService(
      network.protocol,
      new WebEncryptionService()
    );

    const result = await ProtocolService.getNetworkStatus(network);

    return {
      canSendTransaction: result?.canProvideBalance,
      canProvideBalance: result?.canSendTransaction,
      canProvideFee: result?.canProvideFee,
    };
  } catch (e) {
    return {
      canSendTransaction: false,
      canProvideBalance: false,
      canProvideFee: false,
    };
  }
};

export const isTransferHealthyForNetwork = async (network: INetwork) => {
  try {
    const ProtocolService = ProtocolServiceFactory.getProtocolService(
      network.protocol,
      new WebEncryptionService()
    );

    const result = await ProtocolService.getNetworkSendTransactionStatus(
      network
    );

    return !!result?.canSendTransaction;
  } catch (e) {
    return false;
  }
};

export const getAddressFromPrivateKey = async (
  privateKey: string,
  protocol: SupportedProtocols,
  addressPrefix?: string
) => {
  const ProtocolService = ProtocolServiceFactory.getProtocolService(
    protocol,
    new WebEncryptionService()
  );

  return ProtocolService.getAddressFromPrivateKey({
    privateKey,
    addressPrefix,
  });
};

export const isValidPPK = (
  ppkContent: string,
  protocol: SupportedProtocols
) => {
  try {
    if (protocol === SupportedProtocols.Pocket) {
      const jsonObject = JSON.parse(ppkContent);
      // Check if undefined
      if (
        jsonObject.kdf === undefined ||
        jsonObject.salt === undefined ||
        jsonObject.secparam === undefined ||
        jsonObject.ciphertext === undefined
      ) {
        return false;
      }
      // Validate the properties
      if (
        jsonObject.kdf !== "scrypt" ||
        !new RegExp(/^[0-9a-fA-F]+$/).test(jsonObject.salt) ||
        jsonObject.secparam <= 0 ||
        jsonObject.ciphertext.length <= 0
      ) {
        return false;
      }
      return true;
    } else {
      validator.validateJSONSchema(keyStoreSchema, JSON.parse(ppkContent));
      return true;
    }
  } catch (e) {
    return false;
  }
};

export const getPrivateKeyFromPPK = async (
  ppkContent: string,
  filePassword: string,
  protocol: SupportedProtocols
) => {
  if (protocol === SupportedProtocols.Pocket) {
    const isPPKValid = isValidPPK(ppkContent, protocol);

    if (!isPPKValid) {
      throw new Error();
    }

    const jsonObject = JSON.parse(ppkContent);
    const scryptHashLength = 32;
    const ivLength = Number(jsonObject.secparam);
    const tagLength = 16;
    const algorithm = "aes-256-gcm";
    const scryptOptions = {
      N: 32768,
      r: 8,
      p: 1,
      maxmem: 4294967290,
    };
    // Retrieve the salt
    const decryptSalt = Buffer.from(jsonObject.salt, "hex");
    // Scrypt hash
    const scryptHash = await scrypt(
      Buffer.from(filePassword, "utf8"),
      decryptSalt,
      scryptOptions.N,
      scryptOptions.p,
      scryptOptions.r,
      scryptHashLength
    );
    // Create a buffer from the ciphertext
    const inputBuffer = Buffer.from(jsonObject.ciphertext, "base64");

    // Create empty iv, tag and data constants
    const iv = scryptHash.slice(0, ivLength);
    const tag = inputBuffer.slice(inputBuffer.length - tagLength);
    const data = inputBuffer.slice(0, inputBuffer.length - tagLength);

    // Create the decipher
    const decipher = createDecipheriv(algorithm, Buffer.from(scryptHash), iv);
    // Set the auth tag
    decipher.setAuthTag(tag);
    // Update the decipher with the data to utf8
    let privateKey = decipher.update(data, undefined, "utf8");
    privateKey += decipher.final("utf8");

    return privateKey;
  } else {
    const web3Account = await decrypt(ppkContent, filePassword);
    return web3Account.privateKey;
  }
};

const SCRYPT_HASH_LENGTH = 32;
const SCRYPT_OPTIONS = {
  N: 32768,
  r: 8,
  p: 1,
  maxmem: 4294967290,
};

export const getPortableWalletContent = async (
  privateKey: string,
  password: string,
  protocol: SupportedProtocols
): Promise<string> => {
  if (protocol === SupportedProtocols.Pocket) {
    const secParam = 12;
    const algorithm = "aes-256-gcm";
    const salt = randomBytes(16);

    const scryptHash = await scrypt(
      Buffer.from(password, "utf8"),
      salt,
      SCRYPT_OPTIONS.N,
      SCRYPT_OPTIONS.p,
      SCRYPT_OPTIONS.r,
      SCRYPT_HASH_LENGTH
    );
    // Create the nonce from the first 12 bytes of the sha256 Scrypt hash
    const scryptHashBuffer = Buffer.from(scryptHash);
    const iv = Buffer.allocUnsafe(secParam);
    scryptHashBuffer.copy(iv, 0, 0, secParam);
    // Generate ciphertext by using the privateKey, nonce and sha256 Scrypt hash
    const cipher = await createCipheriv(algorithm, scryptHashBuffer, iv);
    let cipherText = cipher.update(privateKey, "utf8", "hex");
    cipherText += cipher.final("hex");
    // Concatenate the ciphertext final + auth tag
    cipherText = cipherText + cipher.getAuthTag().toString("hex");
    // Returns the Armored JSON string
    return JSON.stringify(
      {
        kdf: "scrypt",
        salt: salt.toString("hex"),
        secparam: secParam.toString(),
        hint: "pocket wallet",
        ciphertext: Buffer.from(cipherText, "hex").toString("base64"),
      },
      null,
      2
    );
  } else if (protocol === SupportedProtocols.Ethereum) {
    const keyStore = await encrypt(privateKey, password);

    return JSON.stringify(keyStore);
  } else if (protocol === SupportedProtocols.Cosmos) {
    // TODO: Implement keyFile generation. See: https://github.com/trustsoothe/vault/issues/156
  }
};

export function getAddressFromPublicKey(publicKey: string): Promise<string> {
  return new PocketNetworkProtocolService(
    new WebEncryptionService()
  ).getAddressFromPublicKey(publicKey);
}

export function isValidPublicKey(publicKey: string): boolean {
  return /^[0-9A-Fa-f]{64}$/.test(publicKey);
}

interface RunWithNetworksParam {
  protocol: SupportedProtocols;
  chainId: string;
  customRpcs?: Array<CustomRPC>;
  networks: Array<Network>;
  errorsPreferredNetwork: ErrorsByNetwork;
}

export async function runWithNetworks<T>(
  {
    protocol,
    chainId,
    customRpcs,
    networks,
    errorsPreferredNetwork,
  }: RunWithNetworksParam,
  callback: (network: INetwork) => Promise<T>
): Promise<{ rpcWithErrors: Array<string>; result: T; rpcUrl: string }> {
  const rpcUrls = customRpcs
    .filter(
      (item) =>
        item.protocol === protocol &&
        item.chainId === chainId &&
        item.isPreferred &&
        (errorsPreferredNetwork[item.id] || 0) <= 5
    )
    .map((item) => ({
      id: item.id,
      url: item.url,
      defaultGasPrice: item.defaultGasPrice,
      defaultGasUsed: item.defaultGasUsed,
      defaultGasAdjustment: item.defaultGasAdjustment,
      defaultGasEstimation: item.defaultGasEstimation,
    }));

  const defaultNetwork = networks.find(
    (item) => item.chainId === chainId && item.protocol === protocol
  );

  const rpcWithError: Array<string> = [];
  let result: T, rpcUrl: string;

  for (const {
    url,
    id,
    defaultGasPrice,
    defaultGasAdjustment,
    defaultGasEstimation,
    defaultGasUsed,
  } of [
    ...rpcUrls,
    {
      id: defaultNetwork.id,
      url: defaultNetwork.rpcUrl,
      defaultGasPrice: defaultNetwork.defaultGasPrice,
      defaultGasUsed: defaultNetwork.defaultGasUsed,
      defaultGasAdjustment: defaultNetwork.defaultGasAdjustment,
      defaultGasEstimation: defaultNetwork.defaultGasEstimation,
    },
  ]) {
    try {
      result = await callback({
        protocol,
        chainID: chainId,
        rpcUrl: url,
        defaultGasPrice: defaultGasPrice,
        defaultGasUsed: defaultGasUsed,
        defaultGasAdjustment: defaultGasAdjustment,
        defaultGasEstimation: defaultGasEstimation,
      });
      rpcUrl = url;
      break;
    } catch (e) {
      if (defaultNetwork.id !== id) {
        rpcWithError.push(id);
      } else {
        throw e;
      }
    }
  }

  return { rpcWithErrors: rpcWithError, result, rpcUrl };
}
