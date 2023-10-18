import type { ErrorsPreferredNetwork } from "../redux/slices/vault";
import { Buffer } from "buffer";
import crypto from "crypto-browserify";
import scrypt from "scrypt-js";
import {
  AccountReference,
  Network,
  INetworkOptions,
  ProtocolServiceFactory,
  SerializedNetwork,
  SupportedProtocols,
  SerializedAsset,
  Asset,
} from "@poktscan/keyring";
import { WebEncryptionService } from "@poktscan/keyring-encryption-web";
import { ChainID } from "@poktscan/keyring/dist/lib/core/common/protocols/ChainID";

interface GetFeeParam {
  protocol: SupportedProtocols;
  chainId: ChainID<SupportedProtocols>;
  networks: SerializedNetwork[];
  errorsPreferredNetwork?: ErrorsPreferredNetwork;
}

export const getFee = async ({
  protocol,
  chainId,
  networks,
  errorsPreferredNetwork,
}: GetFeeParam) => {
  const ProtocolService = ProtocolServiceFactory.getProtocolService(
    protocol,
    new WebEncryptionService()
  );

  const networksWithErrors: string[] = [];

  if (errorsPreferredNetwork) {
    const preferredNetworks = networks.filter((item) => {
      const errors =
        errorsPreferredNetwork?.[item.protocol]?.[item.chainID]?.[item.id] || 0;
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
          const network = Network.deserialize(preferredNetwork);
          const fee = await ProtocolService.getFee(network);

          return { fee, networksWithErrors };
        } catch (e) {
          networksWithErrors.push(preferredNetwork.id);
        }
      }
    }
  }

  const networkSerialized = networks.find(
    (item) =>
      item.chainID === chainId && item.protocol === protocol && item.isDefault
  );

  if (!networkSerialized) {
    throw new Error("there is not a default network for this protocol");
  }

  const network = Network.deserialize(networkSerialized);

  const fee = await ProtocolService.getFee(network);
  return { fee, networksWithErrors };
};

interface GetAccountBalanceParam {
  address: string;
  protocol: SupportedProtocols;
  chainId: ChainID<SupportedProtocols>;
  networks: SerializedNetwork[];
  assets: SerializedAsset[];
  errorsPreferredNetwork?: ErrorsPreferredNetwork;
}

export const getAccountBalance = async ({
  address,
  protocol,
  chainId,
  networks,
  assets,
  errorsPreferredNetwork,
}: GetAccountBalanceParam) => {
  const asset = assets.find((item) => item.protocol === protocol);
  const acc = new AccountReference("", "", address, Asset.deserialize(asset));

  const ProtocolService = ProtocolServiceFactory.getProtocolService(
    protocol,
    new WebEncryptionService()
  );

  const networksWithErrors: string[] = [];

  if (errorsPreferredNetwork) {
    const preferredNetworks = networks.filter((item) => {
      const errors =
        errorsPreferredNetwork?.[item.protocol]?.[item.chainID]?.[item.id] || 0;
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
          const network = Network.deserialize(preferredNetwork);

          const balance = await ProtocolService.getBalance(network, acc);

          return { balance: balance ? balance / 1e6 : 0, networksWithErrors };
        } catch (e) {
          networksWithErrors.push(preferredNetwork.id);
        }
      }
    }
  }

  const networkSerialized = networks.find(
    (item) =>
      item.chainID === chainId && item.protocol === protocol && item.isDefault
  );

  if (!networkSerialized) {
    throw new Error("there is not a default network for this protocol");
  }

  const network = Network.deserialize(networkSerialized);

  const balance = await ProtocolService.getBalance(network, acc);

  return { balance: balance ? balance / 1e6 : 0, networksWithErrors };
};

interface GetBalancesParam {
  accounts: {
    address: string;
    protocol: SupportedProtocols;
    chainId: ChainID<SupportedProtocols>;
  }[];
  networks: SerializedNetwork[];
  assets: SerializedAsset[];
  errorsPreferredNetwork: ErrorsPreferredNetwork;
}

export const getBalances = ({
  accounts,
  networks,
  assets,
  errorsPreferredNetwork,
}: GetBalancesParam) => {
  return Promise.all(
    accounts.map(({ address, protocol, chainId }) => {
      return new Promise(async (resolve) => {
        let balance: number,
          error = false,
          networksWithErrors: string[] = [];
        try {
          const result = await getAccountBalance({
            address,
            protocol,
            chainId,
            networks,
            assets,
            errorsPreferredNetwork,
          });
          balance = result.balance;
          networksWithErrors = result.networksWithErrors;
        } catch (e) {
          balance = 0;
          error = true;
        }

        resolve({
          address,
          error,
          balance: balance,
          protocol,
          networksWithErrors,
        });
      });
    })
  ) as Promise<
    {
      address: string;
      balance: number;
      protocol: SupportedProtocols;
      chainId: ChainID<SupportedProtocols>;
      networksWithErrors: string[];
      error: boolean;
    }[]
  >;
};

export const isNetworkUrlHealthy = async (
  networkOpts: INetworkOptions<SupportedProtocols>
) => {
  try {
    const network = new Network(networkOpts);

    const ProtocolService = ProtocolServiceFactory.getProtocolService(
      network.protocol,
      new WebEncryptionService()
    );

    const result = await ProtocolService.updateNetworkStatus(network);

    return (
      result?.status?.canProvideBalance &&
      result?.status?.canSendTransaction &&
      result?.status?.canProvideFee
    );
  } catch (e) {
    return false;
  }
};

export const isTransferHealthyForNetwork = async (
  serializedNetwork: SerializedNetwork
) => {
  try {
    const network = Network.deserialize(serializedNetwork);

    const ProtocolService = ProtocolServiceFactory.getProtocolService(
      network.protocol,
      new WebEncryptionService()
    );

    const result = await ProtocolService.updateSendTransactionStatus(network);

    return !!result?.status?.canSendTransaction;
  } catch (e) {
    return false;
  }
};

// export const protocolsAreEquals = (p1: Protocol, p2: Protocol) =>
//   p1.name === p2.name && p1.chainID === p2.chainID;

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

export const isValidPPK = (ppkContent: string) => {
  try {
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
  } catch (e) {
    return false;
  }
};

export const getPrivateKeyFromPPK = async (
  ppkContent: string,
  filePassword: string
) => {
  const isPPKValid = isValidPPK(ppkContent);

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
  password: string
): Promise<string> => {
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
};
