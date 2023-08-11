import { Protocol } from "@poktscan/keyring/dist/lib/core/common/Protocol";
import {
  Network,
  NetworkOptions,
  ProtocolServiceFactory,
  SerializedNetwork,
} from "@poktscan/keyring";
import { WebEncryptionService } from "@poktscan/keyring-encryption-web";
import store from "../redux/store";
import {
  ErrorsPreferredNetwork,
  increaseErrorPreferredNetwork,
} from "../redux/slices/vault";

export const getFee = async (
  protocol: Protocol,
  networks: SerializedNetwork[],
  errorsPreferredNetwork?: ErrorsPreferredNetwork
) => {
  const ProtocolService = ProtocolServiceFactory.getProtocolService(
    protocol,
    new WebEncryptionService()
  );

  let errorUsingPreferred = false;

  if (errorsPreferredNetwork) {
    const canUsePreferred =
      errorsPreferredNetwork[protocol.name][protocol.chainID].fee <= 5;

    if (canUsePreferred) {
      const preferredNetwork = networks.find(
        (item) =>
          item.protocol.chainID === protocol.chainID &&
          item.protocol.name === protocol.name &&
          //todo: change with item.preferred
          !item.isDefault
      );

      if (preferredNetwork) {
        try {
          const network = Network.deserialize(preferredNetwork);
          const fee = await ProtocolService.getFee(network);

          return { fee, errorUsingPreferred };
        } catch (e) {
          errorUsingPreferred = true;
        }
      }
    }
  }

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

  const fee = await ProtocolService.getFee(network);
  return { fee, errorUsingPreferred };
};

export const getAccountBalance = async (
  address: string,
  protocol: Protocol,
  networks: SerializedNetwork[],
  errorsPreferredNetwork?: ErrorsPreferredNetwork
) => {
  const ProtocolService = ProtocolServiceFactory.getProtocolService(
    protocol,
    new WebEncryptionService()
  );

  let errorUsingPreferred = false;

  if (errorsPreferredNetwork) {
    const canUsePreferred =
      errorsPreferredNetwork[protocol.name][protocol.chainID].balance <= 5;

    if (canUsePreferred) {
      const preferredNetwork = networks.find(
        (item) =>
          item.protocol.chainID === protocol.chainID &&
          item.protocol.name === protocol.name &&
          //todo: change with item.preferred
          !item.isDefault
      );

      if (preferredNetwork) {
        try {
          const network = Network.deserialize(preferredNetwork);

          const balance = await ProtocolService.getBalance(network, address);

          //todo: remove / 1e6 later
          return { balance: balance ? balance / 1e6 : 0, errorUsingPreferred };
        } catch (e) {
          errorUsingPreferred = true;
        }
      }
    }
  }

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
  return { balance: balance ? balance / 1e6 : 0, errorUsingPreferred };
};

export const getBalances = (
  accounts: {
    address: string;
    protocol: Protocol;
  }[],
  networks: SerializedNetwork[],
  errorsPreferredNetwork: ErrorsPreferredNetwork
) => {
  return Promise.all(
    accounts.map(({ address, protocol }) => {
      return new Promise(async (resolve) => {
        let balance: number,
          errorUsingPreferred = false;
        try {
          const result = await getAccountBalance(
            address,
            protocol,
            networks,
            errorsPreferredNetwork
          );
          balance = result.balance;
          errorUsingPreferred = result.errorUsingPreferred;
        } catch (e) {
          balance = 0;
        }

        resolve({ address, balance: balance, protocol, errorUsingPreferred });
      });
    })
  ) as Promise<
    {
      address: string;
      balance: number;
      protocol: Protocol;
      errorUsingPreferred: boolean;
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
