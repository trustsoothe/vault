import type { IProtocolTransactionResult } from "@poktscan/keyring/dist/lib/core/common/protocols/ProtocolTransaction";
import type { RootState } from "../../store";
import type { VaultSliceBuilder } from "../../../types";
import { SerializedError, createAsyncThunk } from "@reduxjs/toolkit";
import set from "lodash/set";
import {
  AccountReference,
  AccountUpdateOptions,
  ImportRecoveryPhraseOptions,
  Passphrase,
  PrivateKeyRestoreErrorName,
  SerializedAccountReference,
  SerializedSession,
  SupportedProtocols,
  TransferOptions,
  VaultRestoreErrorName,
} from "@poktscan/keyring";
import { getVaultPassword, VaultSlice } from "./index";
import { getVault } from "../../../utils";
import {
  addImportedAccountAddress,
  removeImportedAccountAddress,
} from "../app";

const MAX_PASSWORDS_TRIES = 4;
const VAULT_PASSWORD_ID = "vault";
const ExtensionVaultInstance = getVault();

export const importHdWallet = createAsyncThunk(
  "vault/importHdWallet",
  async (options: ImportRecoveryPhraseOptions, context) => {
    const state = context.getState() as RootState;
    const { vaultSession } = state.vault;

    const vaultPassword = await getVaultPassword(vaultSession.id);
    const vaultPassphrase = new Passphrase(vaultPassword);

    const accountReferences = await ExtensionVaultInstance.importRecoveryPhrase(
      vaultSession.id,
      vaultPassphrase,
      options
    );

    return accountReferences.map((account) => account.serialize());
  }
);

export const addNewAccount = createAsyncThunk<
  {
    accountReference: SerializedAccountReference;
    session: SerializedSession;
  },
  {
    sessionId?: string;
    name: string;
    protocol: SupportedProtocols;
  }
>("vault/addNewAccount", async (args, context) => {
  const state = context.getState() as RootState;
  const { vaultSession } = state.vault;

  const vaultPassword = await getVaultPassword(vaultSession.id);
  const vaultPassphrase = new Passphrase(vaultPassword);
  const session = args.sessionId || vaultSession.id;

  const accountReference = await ExtensionVaultInstance.createAccount(
    session,
    vaultPassphrase,
    {
      name: args.name.trim(),
      protocol: args.protocol,
    }
  );

  const updatedSession = await ExtensionVaultInstance.getSession(session);

  return {
    accountReference: accountReference.serialize(),
    session: updatedSession.serialize(),
  };
});

export interface ImportAccountParam {
  protocol: SupportedProtocols;
  name: string;
  privateKey: string;
}

export const importAccount = createAsyncThunk(
  "vault/importAccount",
  async (importOptions: ImportAccountParam, context) => {
    const state = context.getState() as RootState;
    const { vaultSession } = state.vault;
    const vaultPassword = await getVaultPassword(vaultSession.id);
    const vaultPassphrase = new Passphrase(vaultPassword);

    const accountReference =
      await ExtensionVaultInstance.createAccountFromPrivateKey(
        vaultSession.id,
        vaultPassphrase,
        importOptions
      );

    await context.dispatch(addImportedAccountAddress(accountReference.address));

    return accountReference.serialize();
  }
);

export const updateAccount = createAsyncThunk<
  SerializedAccountReference,
  AccountUpdateOptions
>("vault/updateAccount", async (arg, context) => {
  const {
    vault: { vaultSession },
  } = context.getState() as RootState;
  const vaultPassword = await getVaultPassword(vaultSession.id);
  const vaultPassphrase = new Passphrase(vaultPassword);

  const accountReference = await ExtensionVaultInstance.updateAccountName(
    vaultSession.id,
    vaultPassphrase,
    {
      id: arg.id,
      name: arg.name.trim(),
    }
  );

  return accountReference.serialize();
});

export const removeAccount = createAsyncThunk(
  "vault/removeAccount",
  async (
    args: {
      serializedAccount: SerializedAccountReference;
      vaultPassword?: string;
    },
    context
  ) => {
    const {
      vault: { vaultSession },
      app: { requirePasswordForSensitiveOpts },
    } = context.getState() as RootState;

    const { vaultPassword: passwordFromArg, serializedAccount } = args;
    const account = AccountReference.deserialize(serializedAccount);
    const vaultPassword =
      passwordFromArg || requirePasswordForSensitiveOpts
        ? passwordFromArg
        : await getVaultPassword(vaultSession.id);
    const vaultPassphrase = new Passphrase(vaultPassword);

    await ExtensionVaultInstance.removeAccount(
      vaultSession.id,
      vaultPassphrase,
      account
    );

    await context.dispatch(removeImportedAccountAddress(account.address));
  }
);

export interface GetPrivateKeyParam {
  account: SerializedAccountReference;
  vaultPassword: string;
}

export const getPrivateKeyOfAccount = createAsyncThunk<
  string,
  GetPrivateKeyParam
>("vault/getPrivateKeyOfAccount", async (arg, context) => {
  const state = context.getState() as RootState;
  const sessionId = state.vault.vaultSession.id;

  const vaultPassphrase = new Passphrase(arg.vaultPassword);
  return await ExtensionVaultInstance.getAccountPrivateKey(
    sessionId,
    vaultPassphrase,
    AccountReference.deserialize(arg.account)
  );
});

export interface SendTransactionParams
  extends Omit<TransferOptions, "transactionParams"> {
  transactionParams: {
    maxFeePerGas?: number;
    maxPriorityFeePerGas?: number;
    data?: string;
    fee?: number;
    memo?: string;
    gasLimit?: number;
  };
  isRawTransaction?: boolean;
}

export const sendTransfer = createAsyncThunk<string, SendTransactionParams>(
  "vault/sendTransfer",
  async (transferOptions, context) => {
    const state = context.getState() as RootState;
    const sessionId = state.vault.vaultSession.id;

    let result: IProtocolTransactionResult<"Pocket" | "Ethereum">;

    const transactionArg = {
      ...transferOptions,
      transactionParams: {
        from: "",
        to: "",
        amount: "",
        ...transferOptions.transactionParams,
      },
    };

    if (
      !state.app.requirePasswordForSensitiveOpts &&
      !transactionArg.from.passphrase
    ) {
      set(transactionArg, "from.passphrase", await getVaultPassword(sessionId));
    }

    if (transferOptions.isRawTransaction) {
      result = await ExtensionVaultInstance.sendRawTransaction(
        sessionId,
        transactionArg
      );
    } else {
      result = await ExtensionVaultInstance.transferFunds(
        sessionId,
        transactionArg
      );
    }

    return result.transactionHash;
  }
);

const addAddNewAccountToBuilder = (builder: VaultSliceBuilder) => {
  builder.addCase(addNewAccount.rejected, (state, action) => {
    increaseWrongPasswordCounter(VAULT_PASSWORD_ID, state, action.error);
  });

  builder.addCase(addNewAccount.fulfilled, (state, action) => {
    const { accountReference, session } = action.payload;
    state.accounts.push(accountReference);

    const index = state.sessions.findIndex((item) => item.id === session.id);

    if (index !== -1) {
      state.sessions.splice(index, 1, session);
    }

    resetWrongPasswordCounter(VAULT_PASSWORD_ID, state);
  });
};

const addImportHdWalletToBuilder = (builder: VaultSliceBuilder) => {
  builder.addCase(importHdWallet.rejected, (state, action) => {
    increaseWrongPasswordCounter(VAULT_PASSWORD_ID, state, action.error);
  });

  builder.addCase(importHdWallet.fulfilled, (state, action) => {
    const accounts = action.payload;
    state.accounts.push(...accounts);

    resetWrongPasswordCounter(VAULT_PASSWORD_ID, state);
  });
};

const addImportAccountToBuilder = (builder: VaultSliceBuilder) => {
  builder.addCase(importAccount.fulfilled, (state, action) => {
    const account = action.payload;

    state.accounts.push(account);
  });
};

const addUpdateAccountToBuilder = (builder: VaultSliceBuilder) => {
  builder.addCase(updateAccount.fulfilled, (state, action) => {
    const account = action.payload;

    const index = state.accounts.findIndex((item) => item.id === account.id);

    if (index !== -1) {
      state.accounts.splice(index, 1, account);
    }
  });
};

const addRemoveAccountToBuilder = (builder: VaultSliceBuilder) => {
  builder.addCase(removeAccount.fulfilled, (state, action) => {
    const accountId = action.meta.arg.serializedAccount.id;
    const wasVaultPasswordPassed = !!action.meta.arg.vaultPassword;

    state.accounts = state.accounts.filter((item) => item.id !== accountId);

    if (wasVaultPasswordPassed) {
      resetWrongPasswordCounter(VAULT_PASSWORD_ID, state);
    }
  });

  builder.addCase(removeAccount.rejected, (state, action) => {
    increaseWrongPasswordCounter(VAULT_PASSWORD_ID, state, action.error);
  });
};

const addGetPrivateKeyToBuilder = (builder: VaultSliceBuilder) => {
  builder.addCase(getPrivateKeyOfAccount.fulfilled, (state) => {
    resetWrongPasswordCounter(VAULT_PASSWORD_ID, state);
  });
  builder.addCase(getPrivateKeyOfAccount.rejected, (state, action) => {
    increaseWrongPasswordCounter(VAULT_PASSWORD_ID, state, action.error);
  });
};

const addSendTransferToBuilder = (builder: VaultSliceBuilder) => {
  builder.addCase(sendTransfer.fulfilled, (state, action) => {
    if (!!action.meta.arg.from.passphrase) {
      resetWrongPasswordCounter(VAULT_PASSWORD_ID, state);
    }
  });

  builder.addCase(sendTransfer.rejected, (state, action) => {
    if (!!action.meta.arg.from.passphrase) {
      increaseWrongPasswordCounter(VAULT_PASSWORD_ID, state, action.error);
    }
  });
};

export const addAccountThunksToBuilder = (builder: VaultSliceBuilder) => {
  addAddNewAccountToBuilder(builder);
  addImportAccountToBuilder(builder);
  addUpdateAccountToBuilder(builder);
  addRemoveAccountToBuilder(builder);
  addGetPrivateKeyToBuilder(builder);
  addSendTransferToBuilder(builder);
  addImportHdWalletToBuilder(builder);
};

function resetWrongPasswordCounter(id: string, state: VaultSlice) {
  state.wrongPasswordCounter[id] = undefined;
}

function increaseWrongPasswordCounter(
  id: string,
  state: VaultSlice,
  error: SerializedError
) {
  if (
    error?.name === VaultRestoreErrorName ||
    error?.name === PrivateKeyRestoreErrorName
  ) {
    const currentCounter = state.wrongPasswordCounter[id];

    if (currentCounter === MAX_PASSWORDS_TRIES) {
      ExtensionVaultInstance.lockVault();
      state.vaultSession = null;
      state.isUnlockedStatus = "locked_due_wrong_password";
      state.accounts = [];
      state.sessions = [];
      state.wrongPasswordCounter = {};
      return;
    }

    state.wrongPasswordCounter[id] =
      typeof currentCounter === "number" ? currentCounter + 1 : 1;
  }
}
