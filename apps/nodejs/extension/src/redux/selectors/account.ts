import type { RootState } from "../store";
import { AccountType } from "@poktscan/vault";

export const selectedAccountAddressSelector = (state: RootState) => {
  const selectedProtocol = state.app.selectedProtocol;
  return state.app.selectedAccountByProtocol[selectedProtocol];
};

export const selectedAccountByProtocolSelector = (state: RootState) => {
  return state.app.selectedAccountByProtocol;
};

export const selectedAccountSelector = (state: RootState) => {
  const selectedProtocol = state.app.selectedProtocol;
  const selectedAccountAddress =
    state.app.selectedAccountByProtocol[selectedProtocol];

  return state.vault.accounts.find(
    (account) =>
      account.address === selectedAccountAddress &&
      account.accountType !== AccountType.HDSeed
  );
};

export const accountsSelector = (state: RootState) => state.vault.accounts;

export const accountsImportedSelector = (state: RootState) =>
  state.app.accountsImported;

export const seedsSelector = (state: RootState) => state.vault.recoveryPhrases;
