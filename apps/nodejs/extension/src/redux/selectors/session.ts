import type { RootState } from "../store";
import { createSelector } from "@reduxjs/toolkit";

export const tabHasConnectionSelector = (state: RootState) => {
  const sessionsOfTab = state.vault.sessions.filter(
    (item) =>
      !!item.origin && !!state.app.activeTab?.url?.startsWith(item.origin)
  );
  return !!sessionsOfTab.length;
};

export const accountConnectedWithTabSelector = (state: RootState) => {
  const selectedProtocol = state.app.selectedProtocol;
  const selectedAccount = state.app.selectedAccountByProtocol[selectedProtocol];

  const sessionsOfTab = state.vault.sessions.filter(
    (item) =>
      !!item.origin && !!state.app.activeTab?.url?.startsWith(item.origin)
  );

  let accountConnected = false;

  for (const session of sessionsOfTab) {
    accountConnected = session.permissions.some(
      (permission) =>
        permission.resource === "account" &&
        permission.action === "read" &&
        (permission.identities.includes(selectedAccount) ||
          permission.identities.includes("*"))
    );

    if (accountConnected) {
      break;
    }
  }
  return accountConnected;
};

export const externalRequestsSelector = (state: RootState) =>
  state.app.externalRequests;

export const externalRequestsLengthSelector = (state: RootState) =>
  state.app.externalRequests.length;

export const isUnlockedSelector = (state: RootState) =>
  state.vault.isUnlockedStatus === "yes";

export const sessionsSelector = (state: RootState) => state.vault.sessions;

export const blockedListSelector = (state: RootState) =>
  state.app.blockedSites.list;
export const blockedListLoadedSelector = (state: RootState) =>
  state.app.blockedSites.loaded;

export const currentExternalRequest = createSelector(
  externalRequestsSelector,
  (requests) => requests[0] || null
);

export const vaultLockedForWrongPasswordsSelector = (state: RootState) =>
  state.vault.isUnlockedStatus === "locked_due_wrong_password";

export const dateUntilVaultIsLockedSelector = (state: RootState) =>
  state.vault.dateUntilVaultIsLocked;

export const initializeStatusSelector = (state: RootState) =>
  state.vault.initializeStatus;
export const vaultSessionExistsSelector = (state: RootState) =>
  !!state.vault.vaultSession;
