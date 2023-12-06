import type { ErrorsByNetwork } from "../redux/slices/app";
import { Buffer } from "buffer";
import crypto from "crypto-browserify";
import scrypt from "scrypt-js";
import { isAddress as isEthAddress, validator } from "web3-validator";
import { decrypt, encrypt, keyStoreSchema } from "web3-eth-accounts";
import {
  AccountReference,
  EthereumNetworkFeeRequestOptions,
  IAsset,
  INetwork,
  ProtocolServiceFactory,
  SupportedProtocols,
} from "@poktscan/keyring";
import { WebEncryptionService } from "@poktscan/keyring-encryption-web";

const isPocketAddress = (address: string) => {
  return address.match(/^[0-9a-fA-F]+$/g) && new Blob([address]).size === 40;
};

export const isValidAddress = (
  address: string,
  protocol: SupportedProtocols
) => {
  const fn =
    protocol === SupportedProtocols.Pocket ? isPocketAddress : isEthAddress;
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

interface GetFeeParam<T extends SupportedProtocols = SupportedProtocols> {
  protocol: T;
  chainId: string;
  networks: NetworkForOperations[];
  errorsPreferredNetwork?: ErrorsByNetwork;
  options: T extends SupportedProtocols.Ethereum
    ? EthereumNetworkFeeRequestOptions
    : undefined;
}

export const getFee = async ({
  protocol,
  chainId,
  networks,
  errorsPreferredNetwork,
  options,
}: GetFeeParam) => {
  const ProtocolService = ProtocolServiceFactory.getProtocolService(
    protocol,
    new WebEncryptionService()
  );

  const networksWithErrors: string[] = [];

  if (errorsPreferredNetwork) {
    const preferredNetworks = networks.filter((item) => {
      const errors = errorsPreferredNetwork?.[item.id] || 0;
      return (
        item.isPreferred &&
        item.protocol === protocol &&
        item.chainID === chainId &&
        errors <= 5
      );
    });

    if (preferredNetworks.length) {
      for (const preferredNetwork of preferredNetworks) {
        try {
          const fee = await ProtocolService.getFee(
            preferredNetwork,
            protocol === SupportedProtocols.Ethereum ? options : undefined
          );

          return { fee, networksWithErrors };
        } catch (e) {
          networksWithErrors.push(preferredNetwork.id);
        }
      }
    }
  }

  const networkSerialized = networks.find(
    (item) => item.chainID === chainId && item.protocol === protocol
  );

  const fee = await ProtocolService.getFee(
    networkSerialized,
    protocol === SupportedProtocols.Ethereum ? options : undefined
  );
  return { fee, networksWithErrors };
};

export interface NetworkForOperations extends INetwork {
  isPreferred?: boolean;
  isDefault: boolean;
  id: string;
}

interface GetAccountBalanceParam {
  address: string;
  protocol: SupportedProtocols;
  chainId: string;
  networks: NetworkForOperations[];
  errorsPreferredNetwork?: ErrorsByNetwork;
  asset?: { contractAddress: string; decimals: number };
}

export const getAccountBalance = async ({
  address,
  protocol,
  chainId,
  networks,
  errorsPreferredNetwork,
  asset: partialAsset,
}: GetAccountBalanceParam) => {
  const acc = new AccountReference("", "", address, protocol);
  const asset: IAsset =
    protocol === SupportedProtocols.Ethereum && partialAsset
      ? {
          ...partialAsset,
          protocol,
          chainID: chainId,
        }
      : undefined;

  const ProtocolService = ProtocolServiceFactory.getProtocolService(
    protocol,
    new WebEncryptionService()
  );

  const networksWithErrors: string[] = [];

  if (errorsPreferredNetwork) {
    const preferredNetworks = networks.filter((item) => {
      const errors = errorsPreferredNetwork?.[item.id] || 0;
      return (
        item.isPreferred &&
        item.protocol === protocol &&
        item.chainID === chainId &&
        errors <= 5
      );
    });

    if (preferredNetworks.length) {
      for (const preferredNetwork of preferredNetworks) {
        try {
          const balance = await ProtocolService.getBalance(
            acc,
            preferredNetwork,
            asset
          );

          return {
            balance: balance
              ? balance /
                (protocol === SupportedProtocols.Pocket
                  ? 1e6
                  : asset
                  ? 1
                  : 1e18)
              : 0,
            networksWithErrors,
          };
        } catch (e) {
          networksWithErrors.push(preferredNetwork.id);
        }
      }
    }
  }

  const networkSerialized = networks.find(
    (item) => item.chainID === chainId && item.protocol === protocol
  );

  if (!networkSerialized) {
    throw new Error("there is not a default network for this protocol");
  }

  const balance = await ProtocolService.getBalance(
    acc,
    networkSerialized,
    asset
  );

  return {
    balance: balance
      ? balance /
        (protocol === SupportedProtocols.Pocket ? 1e6 : asset ? 1 : 1e18)
      : 0,
    networksWithErrors,
  };
};

export const isNetworkUrlHealthy = async (network: INetwork) => {
  try {
    const ProtocolService = ProtocolServiceFactory.getProtocolService(
      network.protocol,
      new WebEncryptionService()
    );

    const result = await ProtocolService.getNetworkStatus(network);

    return (
      result?.canProvideBalance &&
      result?.canSendTransaction &&
      result?.canProvideFee
    );
  } catch (e) {
    return false;
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
  protocol: SupportedProtocols
) => {
  const ProtocolService = ProtocolServiceFactory.getProtocolService(
    protocol,
    new WebEncryptionService()
  );

  return ProtocolService.getAddressFromPrivateKey(privateKey);
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
    const scryptHash = await scrypt.scrypt(
      Buffer.from(filePassword, "utf8"),
      decryptSalt,
      scryptOptions.N,
      scryptOptions.r,
      scryptOptions.p,
      scryptHashLength
    );
    // Create a buffer from the ciphertext
    const inputBuffer = Buffer.from(jsonObject.ciphertext, "base64");

    // Create empty iv, tag and data constants
    const iv = scryptHash.slice(0, ivLength);
    const tag = inputBuffer.slice(inputBuffer.length - tagLength);
    const data = inputBuffer.slice(0, inputBuffer.length - tagLength);

    // Create the decipher
    const decipher = crypto.createDecipheriv(
      algorithm,
      Buffer.from(scryptHash),
      iv
    );
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
    const salt = crypto.randomBytes(16);

    const scryptHash = await scrypt.scrypt(
      Buffer.from(password, "utf8"),
      salt,
      SCRYPT_OPTIONS.N,
      SCRYPT_OPTIONS.r,
      SCRYPT_OPTIONS.p,
      SCRYPT_HASH_LENGTH
    );
    // Create the nonce from the first 12 bytes of the sha256 Scrypt hash
    const scryptHashBuffer = Buffer.from(scryptHash);
    const iv = Buffer.allocUnsafe(secParam);
    scryptHashBuffer.copy(iv, 0, 0, secParam);
    // Generate ciphertext by using the privateKey, nonce and sha256 Scrypt hash
    const cipher = await crypto.createCipheriv(algorithm, scryptHashBuffer, iv);
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
  } else {
    const keyStore = await encrypt(privateKey, password);

    return JSON.stringify(keyStore);
  }
};
