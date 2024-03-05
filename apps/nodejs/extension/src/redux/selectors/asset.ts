import type { RootState } from "../store";
import type { IAsset } from "../slices/app";
import { createSelector } from "@reduxjs/toolkit";
import { SupportedProtocols } from "@soothe/vault";
import { selectedAccountAddressSelector } from "./account";
import { selectedChainSelector, selectedProtocolSelector } from "./network";

export const assetsSelector = createSelector(
  (state: RootState) => state.app,
  (app) => app.assets
);

export const assetsIdByAccountSelector = (state: RootState) =>
  state.app.assetsIdByAccount;

export const assetsIdOfSelectedAccountSelector = (state: RootState) => {
  const selectedAccountAddress = selectedAccountAddressSelector(state);

  return state.app.assetsIdByAccount[selectedAccountAddress];
};

export const existsAssetsForSelectedNetworkSelector = (state: RootState) => {
  const selectedProtocol = state.app.selectedProtocol;
  const selectedChain = state.app.selectedChainByProtocol[selectedProtocol];

  return state.app.assets.some(
    (asset) =>
      asset.protocol === selectedProtocol && asset.chainId === selectedChain
  );
};

export const assetsOfSelectedAccountSelector = createSelector(
  selectedProtocolSelector,
  selectedChainSelector,
  assetsIdOfSelectedAccountSelector,
  assetsSelector,
  (protocol, chain, assetsOfAccount, assets) => {
    return assets.filter(
      (asset) =>
        (assetsOfAccount || []).includes(asset.id) &&
        asset.protocol === protocol &&
        asset.chainId === chain
    );
  }
);

export const wPoktAssetSelector = createSelector(
  selectedProtocolSelector,
  selectedChainSelector,
  assetsSelector,
  (protocol, chainId, assets) =>
    assets.find(
      (asset) =>
        asset.symbol === "wPOKT" &&
        asset.protocol === protocol &&
        asset.chainId === chainId
    )
);

export const wPoktVaultAddressSelector = (state: RootState) => {
  const selectedProtocol = state.app.selectedProtocol;
  const selectedChain = state.app.selectedChainByProtocol[selectedProtocol];

  return state.app.assets.find(
    (asset) =>
      asset.symbol === "wPOKT" &&
      asset.protocol === SupportedProtocols.Ethereum &&
      asset.chainId === (selectedChain === "mainnet" ? "1" : "5")
  )?.vaultAddress;
};

const MAINNET_BASE_API_URL = process.env.WPOKT_MAINNET_API_BASE_URL;
const TESTNET_BASE_API_URL = process.env.WPOKT_TESTNET_API_BASE_URL;

export const wPoktBaseUrlSelector = (action: string) => (state: RootState) => {
  const selectedChain =
    state.app.selectedChainByProtocol[state.app.selectedProtocol];
  if (action === "mints") {
    return selectedChain === "1" ? MAINNET_BASE_API_URL : TESTNET_BASE_API_URL;
  } else {
    return selectedChain === "mainnet"
      ? MAINNET_BASE_API_URL
      : TESTNET_BASE_API_URL;
  }
};

export const assetAlreadyIncludedSelector =
  (asset?: IAsset) => (state: RootState) => {
    const selectedAccountAddress = selectedAccountAddressSelector(state);

    return state.app.assetsIdByAccount[selectedAccountAddress]?.includes(
      asset?.id
    );
  };

export const idOfMintsSentSelector = (state: RootState) =>
  state.app.idOfMintsSent;
