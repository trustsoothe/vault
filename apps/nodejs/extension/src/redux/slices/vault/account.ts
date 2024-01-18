import type { IProtocolTransactionResult } from "@poktscan/keyring/dist/lib/core/common/protocols/ProtocolTransaction";
import type { RootState } from "../../store";
import type { VaultSliceBuilder } from "../../../types";
import { SerializedError, createAsyncThunk } from "@reduxjs/toolkit";
import {
  AccountReference,
  AccountUpdateOptions,
  Passphrase,
  PrivateKeyRestoreErrorName,
  SerializedAccountReference,
  SerializedSession,
  SupportedProtocols,
  SupportedTransferOrigins,
  TransferOptions,
  VaultRestoreErrorName,
} from "@poktscan/keyring";
import { getVaultPassword, VaultSlice } from "./index";
import { getVault } from "../../../utils";

const MAX_PASSWORDS_TRIES = 4;
const VAULT_PASSWORD_ID = "vault";
const ExtensionVaultInstance = getVault();

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

export const importAccount = createAsyncThunk<
  SerializedAccountReference,
  ImportAccountParam
>("vault/importAccount", async (importOptions, context) => {
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

  return accountReference.serialize();
});

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

    return await ExtensionVaultInstance.removeAccount(
      vaultSession.id,
      vaultPassphrase,
      account
    );
  }
);

export interface GetPrivateKeyParam {
  account: SerializedAccountReference;
  vaultPassword?: string;
}

export const getPrivateKeyOfAccount = createAsyncThunk<
  string,
  GetPrivateKeyParam
>("vault/getPrivateKeyOfAccount", async (arg, context) => {
  const state = context.getState() as RootState;
  const sessionId = state.vault.vaultSession.id;

  const vaultPassword =
    arg.vaultPassword || state.app.requirePasswordForSensitiveOpts
      ? arg.vaultPassword
      : await getVaultPassword(sessionId);
  const vaultPassphrase = new Passphrase(vaultPassword);
  return await ExtensionVaultInstance.getAccountPrivateKey(
    sessionId,
    vaultPassphrase,
    AccountReference.deserialize(arg.account),
    // todo: remove this?
    vaultPassphrase
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

    let result: IProtocolTransactionResult<
      "Pocket" | "Ethereum"
    >;

    const transactionArg = {
      ...transferOptions,
      transactionParams: {
        from: "",
        to: "",
        amount: "",
        ...transferOptions.transactionParams,
      },
    };

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

const addImportAccountToBuilder = (builder: VaultSliceBuilder) => {
  builder.addCase(importAccount.rejected, (state, action) => {
    console.log("IMPORT ACCOUNT ERR:", action.error);

    increaseWrongPasswordCounter(VAULT_PASSWORD_ID, state, action.error);
  });

  builder.addCase(importAccount.fulfilled, (state, action) => {
    const accountReference = action.payload;

    state.accounts.push(accountReference);

    resetWrongPasswordCounter(VAULT_PASSWORD_ID, state);
  });
};

const addUpdateAccountToBuilder = (builder: VaultSliceBuilder) => {
  builder.addCase(updateAccount.rejected, (state, action) => {
    increaseWrongPasswordCounter(VAULT_PASSWORD_ID, state, action.error);
  });

  builder.addCase(updateAccount.fulfilled, (state, action) => {
    const account = action.payload;

    const index = state.accounts.findIndex((item) => item.id === account.id);

    if (index !== -1) {
      state.accounts.splice(index, 1, account);
    }

    resetWrongPasswordCounter(VAULT_PASSWORD_ID, state);
  });
};

const addRemoveAccountToBuilder = (builder: VaultSliceBuilder) => {
  builder.addCase(removeAccount.fulfilled, (state, action) => {
    const accountId = action.meta.arg.serializedAccount.id;

    state.accounts = state.accounts.filter((item) => item.id !== accountId);

    resetWrongPasswordCounter(VAULT_PASSWORD_ID, state);
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
    if (action.meta.arg.from.type === SupportedTransferOrigins.VaultAccountId) {
      resetWrongPasswordCounter(VAULT_PASSWORD_ID, state);
    }
  });

  builder.addCase(sendTransfer.rejected, (state, action) => {
    if (action.meta.arg.from.type === SupportedTransferOrigins.VaultAccountId) {
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
