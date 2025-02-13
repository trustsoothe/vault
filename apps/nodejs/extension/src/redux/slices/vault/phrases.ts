import type { RootState } from "../../store";
import type { VaultSliceBuilder } from "../../../types";
import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  Passphrase,
  ImportRecoveryPhraseRequest,
  UpdateRecoveryPhraseRequest,
  AccountType,
} from "@soothe/vault";
import { getVaultPassword } from "./index";
import { getVault } from "../../../utils";
import {
  increaseWrongPasswordCounter,
  removeAccount,
  resetWrongPasswordCounter,
  VAULT_PASSWORD_ID,
} from "./account";
import {
  addImportedAccountAddress,
  removeImportedAccountAddress,
} from "../app";

const ExtensionVaultInstance = getVault();

export interface ImportRecoveryPhraseOptions
  extends ImportRecoveryPhraseRequest {
  imported?: boolean;
}

export const importRecoveryPhrase = createAsyncThunk(
  "vault/importRecoveryPhrase",
  async ({ imported, ...options }: ImportRecoveryPhraseOptions, context) => {
    const state = context.getState() as RootState;
    const { vaultSession } = state.vault;

    const vaultPassword = await getVaultPassword(vaultSession.id);
    const vaultPassphrase = new Passphrase(vaultPassword);

    const recoveryPhraseReference =
      await ExtensionVaultInstance.importRecoveryPhrase(
        vaultSession.id,
        vaultPassphrase,
        options
      );

    if (imported) {
      const id = recoveryPhraseReference.id;
      await context.dispatch(addImportedAccountAddress(id));
    }

    return recoveryPhraseReference.serialize();
  }
);
export const updateRecoveryPhrase = createAsyncThunk(
  "vault/updateRecoveryPhrase",
  async (options: UpdateRecoveryPhraseRequest, context) => {
    const state = context.getState() as RootState;
    const { vaultSession } = state.vault;

    const vaultPassword = await getVaultPassword(vaultSession.id);
    const vaultPassphrase = new Passphrase(vaultPassword);

    const recoveryPhraseReference =
      await ExtensionVaultInstance.updateRecoveryPhrase(
        vaultSession.id,
        vaultPassphrase,
        options
      );

    return recoveryPhraseReference.serialize();
  }
);

export interface RemoveRecoveryPhraseOptions {
  recoveryPhraseId: string;
  vaultPassword?: string;
}

export const removeRecoveryPhrase = createAsyncThunk(
  "vault/removeRecoveryPhrase",
  async (
    {
      recoveryPhraseId,
      vaultPassword: vaultPasswordFromArgs,
    }: RemoveRecoveryPhraseOptions,
    context
  ) => {
    const state = context.getState() as RootState;
    const { vaultSession } = state.vault;

    const vaultPassword =
      vaultPasswordFromArgs || state.app.requirePasswordForSensitiveOpts
        ? vaultPasswordFromArgs
        : await getVaultPassword(vaultSession.id);

    const vaultPassphrase = new Passphrase(vaultPassword);

    await ExtensionVaultInstance.removeRecoveryPhrase(
      vaultSession.id,
      vaultPassphrase,
      recoveryPhraseId
    );

    const accountsToRemove = state.vault.accounts.filter(
      (account) =>
        account.accountType === AccountType.HDSeed &&
        account.seedId === recoveryPhraseId
    );

    if (accountsToRemove.length) {
      for (const account of accountsToRemove) {
        await context.dispatch(
          removeAccount({
            serializedAccount: account,
            vaultPassword,
          })
        );
      }
    }

    await context.dispatch(removeImportedAccountAddress(recoveryPhraseId));
  }
);

const addImportRecoveryPhraseThunk = (builder: VaultSliceBuilder) => {
  builder.addCase(importRecoveryPhrase.rejected, (state, action) => {
    increaseWrongPasswordCounter(VAULT_PASSWORD_ID, state, action.error);
  });

  builder.addCase(importRecoveryPhrase.fulfilled, (state, action) => {
    const recoveryPhraseReference = action.payload;
    state.recoveryPhrases.push(recoveryPhraseReference);

    resetWrongPasswordCounter(VAULT_PASSWORD_ID, state);
  });
};

const addUpdateRecoveryPhraseToBuilder = (builder: VaultSliceBuilder) => {
  builder.addCase(updateRecoveryPhrase.fulfilled, (state, action) => {
    const recoveryPhraseReference = action.payload;

    const index = state.recoveryPhrases.findIndex(
      (item) => item.id === recoveryPhraseReference.id
    );

    if (index !== -1) {
      state.recoveryPhrases.splice(index, 1, recoveryPhraseReference);
    }
  });

  builder.addCase(updateRecoveryPhrase.rejected, (state, action) => {
    increaseWrongPasswordCounter(VAULT_PASSWORD_ID, state, action.error);
  });
};

const addRemoveRecoveryPhraseToBuilder = (builder: VaultSliceBuilder) => {
  builder.addCase(removeRecoveryPhrase.fulfilled, (state, action) => {
    const phraseId = action.meta.arg.recoveryPhraseId;
    const wasVaultPasswordPassed = !!action.meta.arg.vaultPassword;

    state.recoveryPhrases = state.recoveryPhrases.filter(
      (item) => item.id !== phraseId
    );

    if (wasVaultPasswordPassed) {
      resetWrongPasswordCounter(VAULT_PASSWORD_ID, state);
    }
  });

  builder.addCase(removeRecoveryPhrase.rejected, (state, action) => {
    increaseWrongPasswordCounter(VAULT_PASSWORD_ID, state, action.error);
  });
};

export const addPhraseThunksToBuilder = (builder: VaultSliceBuilder) => {
  addImportRecoveryPhraseThunk(builder);
  addUpdateRecoveryPhraseToBuilder(builder);
  addRemoveRecoveryPhraseToBuilder(builder);
};
