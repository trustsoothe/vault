import type { RootState } from "../store";
import type { IAsset } from "../slices/app";
import { SupportedProtocols } from "@poktscan/keyring";

export const accountBalancesSelector = (state: RootState) =>
  state.app.accountBalances;

export const balanceMapConsideringAsset =
  (asset?: IAsset) => (state: RootState) => {
    const selectedProtocol = state.app.selectedProtocol;
    const selectedChain = state.app.selectedChainByProtocol[selectedProtocol];

    const chainBalanceMap =
      state.app.accountBalances?.[selectedProtocol]?.[selectedChain];

    if (asset && selectedProtocol === SupportedProtocols.Ethereum) {
      return chainBalanceMap?.[asset.contractAddress];
    }

    return chainBalanceMap;
  };

export const selectedAccountIdSelector = (state: RootState) => {
  const selectedProtocol = state.app.selectedProtocol;
  return state.app.selectedAccountByProtocol[selectedProtocol];
};

export const selectedAccountSelector = (state: RootState) => {
  const selectedProtocol = state.app.selectedProtocol;
  const selectedAccountId =
    state.app.selectedAccountByProtocol[selectedProtocol];

  return state.vault.accounts.find(
    (account) => account.id === selectedAccountId
  );
};

export const selectedAccountAddressSelector = (state: RootState) => {
  return selectedAccountSelector(state)?.address;
};

export const accountsSelector = (state: RootState) => state.vault.accounts;

export const wPoktBalanceSelector = (state: RootState) => {
  const selectedProtocol = state.app.selectedProtocol;
  const selectedChain = state.app.selectedChainByProtocol[selectedProtocol];
  const selectedAccountId =
    state.app.selectedAccountByProtocol[selectedProtocol];

  const chainBalanceMap =
    state.app.accountBalances?.[selectedProtocol]?.[selectedChain];
  const accountAddress = state.vault.accounts.find(
    (account) => account.id === selectedAccountId
  )?.address;

  if (selectedProtocol === SupportedProtocols.Pocket) {
    return chainBalanceMap?.[accountAddress]?.amount || 0;
  } else {
    const assetContractAddress = state.app.assets.find(
      (asset) =>
        asset.symbol === "wPOKT" &&
        asset.protocol === selectedProtocol &&
        asset.chainId === selectedChain
    )?.contractAddress;
    return (
      chainBalanceMap?.[assetContractAddress]?.[accountAddress]?.amount || 0
    );
  }
};

export const existsAccountsOfSelectedProtocolSelector = (state: RootState) =>
  state.vault.accounts.some(
    (account) => account.protocol === state.app.selectedProtocol
  );
