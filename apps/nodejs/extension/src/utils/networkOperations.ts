import type { CustomRPC, ErrorsByNetwork, Network } from "../redux/slices/app";
import { Buffer } from "buffer";
import { z, ZodError } from "zod";
import crypto from "crypto-browserify";
import { scrypt } from "ethereum-cryptography/scrypt.js";
import {
  isAddress as isEthAddress,
  isBytes,
  isInt,
  isUInt,
  validator,
} from "web3-validator";
import { decrypt, encrypt, keyStoreSchema } from "web3-eth-accounts";
import {
  INetwork,
  PocketNetworkProtocolService,
  ProtocolServiceFactory,
  SupportedProtocols,
} from "@poktscan/vault";
import { WebEncryptionService } from "@poktscan/vault-encryption-web";
import {
  propertyIsNotValid,
  propertyIsRequired,
  propertyOfTypeIsNotValid,
  typeIsNotValid,
} from "../errors/communication";

const isPocketAddress = (address: string) => {
  return address.match(/^[0-9a-fA-F]+$/g) && new Blob([address]).size === 40;
};

const isShannonAddress = (address: string) => {
  const regex = /^pokt[ac-hj-np-z0-9]{39}$/;

  if (!regex.test(address)) {
    return false;
  }

  return true;
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
        return isEthAddress
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

const solidityTypes = ["string", "address", "int", "uint", "bytes"];
const isValidSolidityType = (type: string) => {
  try {
    if (solidityTypes.includes(type)) {
      return true;
    }

    if (type.startsWith("bytes")) {
      const num = Number(type.replace("bytes", ""));

      return num >= 1 && num <= 32;
    }

    if (type.startsWith("int") || type.startsWith("uint")) {
      const num = Number(type.replace("int", "").replace("u", ""));

      return num >= 8 && num <= 256;
    }

    return false;
  } catch (e) {
    return false;
  }
};

const typedDataSchema = z.object({
  types: z.record(
    z.string(),
    z.array(
      z
        .object({
          name: z.string(),
          type: z.string(),
        })
        .strict()
    )
  ),
  domain: z
    .object({
      name: z.string(),
      version: z.string().or(z.number().transform(String)),
      chainId: z.number().int(),
      verifyingContract: z.string(),
      salt: z.string(),
    })
    .partial()
    .refine((value) => Object.keys(value).length !== 0, "cannot be empty"),
  primaryType: z.string(),
  message: z.record(z.string(), z.any()),
});

export const validateTypedDataPayload = (
  payload: z.infer<typeof typedDataSchema>
) => {
  try {
    if (!payload.types) {
      return propertyIsRequired("types");
    }

    if (!payload.primaryType) {
      return propertyIsRequired("primaryType");
    }

    if (!payload.domain) {
      return propertyIsRequired("domain");
    }

    if (!payload.message) {
      return propertyIsRequired("message");
    }

    try {
      payload = typedDataSchema.parse(payload);
    } catch (e) {
      const zodError: ZodError = e;
      const path = zodError?.issues?.[0]?.path?.[0];

      return propertyIsNotValid(path as string);
    }

    const getPropsOfType = (type) =>
      payload.types[type].reduce(
        (acc, item) => ({ ...acc, [item.name]: item.type }),
        {}
      );

    const validateType = (obj: object, type: keyof typeof payload.types) => {
      const types = getPropsOfType(type);

      for (const objKey in obj) {
        const value = obj[objKey];
        const typeOfValue = types[objKey].replaceAll("[]", "");

        const checkType = (valueItem: string | object | number) => {
          if (payload.types[typeOfValue]) {
            const err = validateType(valueItem as object, typeOfValue);

            if (err) {
              return err;
            }
          } else {
            if (!isValidSolidityType(typeOfValue)) {
              return typeIsNotValid(typeOfValue);
            }

            let invalid = false;

            if (typeOfValue === "string" && typeof valueItem !== "string") {
              invalid = true;
            } else if (
              typeOfValue === "address" &&
              !isEthAddress(valueItem as string)
            ) {
              invalid = true;
            } else if (/^u?int/.test(typeOfValue)) {
              const isValid = typeOfValue.startsWith("u") ? isUInt : isInt;

              if (!isValid(valueItem as number, { abiType: typeOfValue })) {
                invalid = true;
              }
            } else if (
              typeOfValue.startsWith("bytes") &&
              !isBytes(valueItem as string, { abiType: typeOfValue })
            ) {
              invalid = true;
            }

            if (invalid) {
              return propertyOfTypeIsNotValid(objKey, typeOfValue);
            }
          }
        };

        if (types[objKey].endsWith("[]")) {
          if (Array.isArray(value)) {
            for (const item of value) {
              const err = checkType(item);

              if (err) {
                return err;
              }
            }
          } else {
            return propertyOfTypeIsNotValid(objKey, `${typeOfValue}[]`);
          }
        } else {
          const err = checkType(value);

          if (err) {
            return err;
          }
        }
      }
    };

    const errDomain = validateType(payload.domain, "EIP712Domain");

    if (errDomain) {
      return errDomain;
    }

    return validateType(payload.message, payload.primaryType);
  } catch (e) {
    return propertyIsNotValid("TypedData (params[1])");
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
    }));

  const defaultNetwork = networks.find(
    (item) => item.chainId === chainId && item.protocol === protocol
  );

  const rpcWithError: Array<string> = [];
  let result: T, rpcUrl: string;

  for (const { url, id } of [
    ...rpcUrls,
    {
      id: defaultNetwork.id,
      url: defaultNetwork.rpcUrl,
    },
  ]) {
    try {
      result = await callback({
        protocol,
        chainID: chainId,
        rpcUrl: url,
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
