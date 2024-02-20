import type { ErrorsByNetwork } from "../redux/slices/app";
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
  AccountReference,
  EthereumNetworkFeeRequestOptions,
  IAsset,
  INetwork,
  ProtocolServiceFactory,
  SupportedProtocols,
} from "@poktscan/keyring";
import { WebEncryptionService } from "@poktscan/keyring-encryption-web";
import {
  propertyIsNotValid,
  propertyIsRequired,
  propertyOfTypeIsNotValid,
  typeIsNotValid,
} from "../errors/communication";

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
  const acc = new AccountReference({
    id: "",
    name: "",
    address,
    protocol,
  });

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
