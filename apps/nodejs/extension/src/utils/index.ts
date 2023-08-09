import type { Protocol } from "@poktscan/keyring/dist/lib/core/common/Protocol";
import type { TProtocol } from "../controllers/communication/Proxy";
import {
  ForbiddenSessionError,
  InvalidSessionError,
  Network,
  NetworkOptions,
  ProtocolServiceFactory,
  SerializedAsset,
  SerializedNetwork,
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

export const isAddress = (str: string) => isHex(str) && byteLength(str) === 40;

export const isPrivateKey = (str: string) =>
  isHex(str) && byteLength(str) === 128;

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

export const getFee = async (
  protocol: Protocol,
  networks: SerializedNetwork[]
) => {
  const ProtocolService = ProtocolServiceFactory.getProtocolService(
    protocol,
    new WebEncryptionService()
  );

  const networkSerialized = networks.find(
    (item) =>
      item.protocol.chainID === protocol.chainID &&
      item.protocol.name === protocol.name &&
      item.isDefault
  );

  if (!networkSerialized) {
    throw new Error("there is not a default network for this protocol");
  }

  const network = Network.deserialize(networkSerialized);

  const result = await ProtocolService.getFee(network);

  return result;
};

export const getAccountBalance = async (
  address: string,
  protocol: Protocol,
  networks: SerializedNetwork[]
) => {
  const ProtocolService = ProtocolServiceFactory.getProtocolService(
    protocol,
    new WebEncryptionService()
  );

  const networkSerialized = networks.find(
    (item) =>
      item.protocol.chainID === protocol.chainID &&
      item.protocol.name === protocol.name &&
      item.isDefault
  );

  if (!networkSerialized) {
    throw new Error("there is not a default network for this protocol");
  }

  const network = Network.deserialize(networkSerialized);

  const balance = await ProtocolService.getBalance(network, address);

  //todo: remove / 1e6 later
  return balance ? balance / 1e6 : 0;
};

export const getBalances = (
  accounts: {
    address: string;
    protocol: Protocol;
  }[],
  networks: SerializedNetwork[]
) => {
  return Promise.all(
    accounts.map(({ address, protocol }) => {
      return new Promise(async (resolve) => {
        let balance: number;
        try {
          balance = await getAccountBalance(address, protocol, networks);
        } catch (e) {
          balance = 0;
        }

        resolve({ address, balance: balance, protocol });
      });
    })
  ) as Promise<
    {
      address: string;
      balance: number;
      protocol: Protocol;
    }[]
  >;
};

export const isNetworkUrlHealthy = async (networkOpts: NetworkOptions) => {
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

export const wait = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));
