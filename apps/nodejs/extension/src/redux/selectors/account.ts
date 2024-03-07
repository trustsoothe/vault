import type { RootState } from "../store";
import type { IAsset } from "../slices/app";
import {AccountType, SupportedProtocols} from '@soothe/vault'

export const accountBalancesSelector = (state: RootState) =>
  state.app.accountBalances;

export const balanceMapOfNetworkSelector =
  (protocol: SupportedProtocols, chainId: string, asset?: IAsset) =>
  (state: RootState) => {
    const chainBalanceMap = state.app.accountBalances?.[protocol]?.[chainId];

    if (asset && protocol === SupportedProtocols.Ethereum) {
      return chainBalanceMap?.[asset.contractAddress];
    }

    return chainBalanceMap;
  };

export const balanceMapConsideringAsset =
  (asset?: IAsset) => (state: RootState) => {
    const selectedProtocol = state.app.selectedProtocol;
    const selectedChain = state.app.selectedChainByProtocol[selectedProtocol];

    return balanceMapOfNetworkSelector(
      selectedProtocol,
      selectedChain,
      asset
    )(state);
  };

export const selectedAccountAddressSelector = (state: RootState) => {
  const selectedProtocol = state.app.selectedProtocol;
  return state.app.selectedAccountByProtocol[selectedProtocol];
};

export const selectedAccountSelector = (state: RootState) => {
  const selectedProtocol = state.app.selectedProtocol;
  const selectedAccountAddress =
    state.app.selectedAccountByProtocol[selectedProtocol];

  return state.vault.accounts.find(
    (account) => account.address === selectedAccountAddress && account.accountType !== AccountType.HDSeed
  );
};

export const accountsSelector = (state: RootState) => state.vault.accounts;

export const wPoktBalanceSelector = (state: RootState) => {
  const selectedProtocol = state.app.selectedProtocol;
  const selectedChain = state.app.selectedChainByProtocol[selectedProtocol];
  const selectedAccountAddress =
    state.app.selectedAccountByProtocol[selectedProtocol];

  const chainBalanceMap =
    state.app.accountBalances?.[selectedProtocol]?.[selectedChain];

  if (selectedProtocol === SupportedProtocols.Pocket) {
    return chainBalanceMap?.[selectedAccountAddress]?.amount || 0;
  } else {
    const assetContractAddress = state.app.assets.find(
      (asset) =>
        asset.symbol === "wPOKT" &&
        asset.protocol === selectedProtocol &&
        asset.chainId === selectedChain
    )?.contractAddress;
    return (
      chainBalanceMap?.[assetContractAddress]?.[selectedAccountAddress]
        ?.amount || 0
    );
  }
};

export const existsAccountsOfSelectedProtocolSelector = (state: RootState) =>
  state.vault.accounts.some(
    (account) => account.protocol === state.app.selectedProtocol
  );

export const accountsImportedSelector = (state: RootState) =>
  state.app.accountsImported;
