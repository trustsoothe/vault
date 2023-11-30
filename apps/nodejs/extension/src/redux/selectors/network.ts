import type { RootState } from "../store";
import type { CustomRPC, Network } from "../slices/app";
import { SupportedProtocols } from "@poktscan/keyring";

export const networksSelector = (state: RootState) => state.app.networks;

export const selectedProtocolSelector = (state: RootState) =>
  state.app.selectedProtocol;
export const selectedChainByProtocolSelector = (state: RootState) =>
  state.app.selectedChainByProtocol;

export const selectedChainSelector = (state: RootState) => {
  const selectedProtocol = state.app.selectedProtocol;
  return state.app.selectedChainByProtocol[selectedProtocol];
};

export const networkSymbolSelector = (state: RootState) => {
  const selectedProtocol = state.app.selectedProtocol;
  const selectedChain = state.app.selectedChainByProtocol[selectedProtocol];
  return (
    state.app.networks.find(
      (network) =>
        network.protocol === selectedProtocol &&
        network.chainId === selectedChain
    )?.currencySymbol || ""
  );
};

export const symbolOfNetworkSelector =
  (protocol: SupportedProtocols, chainId: string) => (state: RootState) => {
    return (
      state.app.networks.find(
        (network) =>
          network.protocol === protocol && network.chainId === chainId
      )?.currencySymbol || ""
    );
  };

export const transferMinAmountOfNetworkSelector =
  (protocol: SupportedProtocols, chainId: string) => (state: RootState) => {
    return state.app.networks.find(
      (network) => network.protocol === protocol && network.chainId === chainId
    )?.transferMinValue;
  };

export const explorerAccountUrlSelector =
  (urlOfAsset?: boolean) => (state: RootState) => {
    const selectedProtocol = state.app.selectedProtocol;
    const selectedChain = state.app.selectedChainByProtocol[selectedProtocol];

    return state.app.networks.find(
      (network) =>
        network.protocol === selectedProtocol &&
        network.chainId === selectedChain
    )?.[urlOfAsset ? "explorerAccountWithAssetUrl" : "explorerAccountUrl"];
  };

export const explorerTransactionUrlOfNetworkSelector =
  (protocol: SupportedProtocols, chainId: string) => (state: RootState) => {
    return state.app.networks.find(
      (network) => network.protocol === protocol && network.chainId === chainId
    )?.explorerTransactionUrl;
  };
export const explorerTransactionUrlSelector = (state: RootState) => {
  const selectedProtocol = state.app.selectedProtocol;
  const selectedChain = state.app.selectedChainByProtocol[selectedProtocol];

  return explorerTransactionUrlOfNetworkSelector(
    selectedProtocol,
    selectedChain
  )(state);
};

export const explorerAccountUrlForWpoktSelector = (state: RootState) => {
  const selectedNetwork = state.app.selectedProtocol;
  const selectedChain = state.app.selectedChainByProtocol[selectedNetwork];

  if (selectedNetwork === SupportedProtocols.Pocket) {
    const assetChain = selectedChain === "mainnet" ? "1" : "5";

    const asset = state.app.assets.find(
      (item) =>
        item.protocol === SupportedProtocols.Ethereum &&
        item.chainId === assetChain &&
        item.symbol === "wPOKT"
    );

    return state.app.networks
      .find(
        (network) =>
          network.protocol === SupportedProtocols.Ethereum &&
          network.chainId === assetChain
      )
      ?.explorerAccountWithAssetUrl?.replace(
        ":contractAddress",
        asset?.contractAddress
      );
  }

  const expectedChain = selectedChain === "1" ? "mainnet" : "testnet";

  return state.app.networks.find(
    (network) =>
      network.protocol === SupportedProtocols.Pocket &&
      network.chainId === expectedChain
  )?.explorerAccountUrl;
};

export const canNetworkBeSelected = (network: Network) => (state: RootState) =>
  state.app.networksCanBeSelected[network.protocol].includes(network.chainId);

export const chainIdLabelSelector = (rpc: CustomRPC) => (state: RootState) =>
  state.app.networks.find(
    (network) =>
      network.protocol === rpc.protocol && network.chainId === rpc.chainId
  )?.chainIdLabel;

export const customRpcsSelector = (state) => state.app.customRpcs;
