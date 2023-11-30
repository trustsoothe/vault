import type { RootState } from "../../store";
import type { VaultSliceBuilder } from "../../../types";
import { SerializedError, createAsyncThunk } from "@reduxjs/toolkit";
import browser from "webextension-polyfill";
import {
  AccountReference,
  AccountUpdateOptions,
  Passphrase,
  PrivateKeyRestoreError,
  SerializedAccountReference,
  SerializedSession,
  SupportedProtocols,
  SupportedTransferOrigins,
  TransferOptions,
  VaultRestoreError,
} from "@poktscan/keyring";
import { WebEncryptionService } from "@poktscan/keyring-encryption-web";
import { PASSPHRASE, VaultSlice } from "./index";
import { getVault } from "../../../utils";

const MAX_PASSWORDS_TRIES = 4;
const VAULT_PASSWORD_ID = "vault";
const webEncryptionService = new WebEncryptionService();
const ExtensionVaultInstance = getVault();

export const addNewAccount = createAsyncThunk<
  {
    accountReference: SerializedAccountReference;
    session: SerializedSession;
  },
  {
    sessionId?: string;
    password: string;
    name: string;
    protocol: SupportedProtocols;
    vaultPassword?: string;
  }
>("vault/addNewAccount", async (args, context) => {
  const state = context.getState() as RootState;
  const { vaultSession, passwordRemembered } = state.vault;
  let vaultPassword: string;
  if (passwordRemembered) {
    const passwordEncryptedObj = await browser.storage.session.get(
      vaultSession.id
    );

    const passphraseEncrypted: string = passwordEncryptedObj[vaultSession.id];

    if (!passphraseEncrypted) {
      throw Error("Password not found");
    }

    const decryptPassphrase = new Passphrase(PASSPHRASE);
    vaultPassword = await webEncryptionService.decrypt(
      decryptPassphrase,
      passphraseEncrypted
    );
  } else {
    vaultPassword = args.vaultPassword;
  }

  const vaultPassphrase = new Passphrase(vaultPassword);
  const session = args.sessionId || vaultSession.id;
  const accountPassphrase = new Passphrase(args.password);

  const accountReference = await ExtensionVaultInstance.createAccount(
    session,
    vaultPassphrase,
    {
      name: args.name.trim(),
      protocol: args.protocol,
      passphrase: accountPassphrase,
    }
  );

  const updatedSession = await ExtensionVaultInstance.getSession(session);

  return {
    accountReference: accountReference.serialize(),
    session: updatedSession.serialize(),
  };
});

export interface ImportAccountParam {
  accountData: {
    protocol: SupportedProtocols;
    name: string;
    accountPassword: string;
    privateKey: string;
  };
  replace: boolean;
  vaultPassword?: string;
}

export const importAccount = createAsyncThunk<
  SerializedAccountReference,
  ImportAccountParam
>("vault/importAccount", async (args, context) => {
  const state = context.getState() as RootState;
  const { vaultSession, passwordRemembered } = state.vault;
  let vaultPassword: string;
  if (passwordRemembered) {
    const passwordEncryptedObj = await browser.storage.session.get(
      vaultSession.id
    );

    const passphraseEncrypted: string = passwordEncryptedObj[vaultSession.id];

    if (!passphraseEncrypted) {
      throw Error("Password not found");
    }

    const decryptPassphrase = new Passphrase(PASSPHRASE);
    vaultPassword = await webEncryptionService.decrypt(
      decryptPassphrase,
      passphraseEncrypted
    );
  } else {
    vaultPassword = args.vaultPassword;
  }

  const vaultPassphrase = new Passphrase(vaultPassword);
  const accountPassphrase = new Passphrase(args.accountData.accountPassword);

  const accountReference =
    await ExtensionVaultInstance.createAccountFromPrivateKey(
      vaultSession.id,
      vaultPassphrase,
      {
        protocol: args.accountData.protocol,
        passphrase: accountPassphrase,
        name: args.accountData.name,
        privateKey: args.accountData.privateKey,
      },
      args.replace
    );

  return accountReference.serialize();
});

export const updateAccount = createAsyncThunk<
  SerializedAccountReference,
  AccountUpdateOptions & { vaultPassword?: string }
>("vault/updateAccount", async (arg, context) => {
  const {
    vault: { vaultSession, passwordRemembered },
  } = context.getState() as RootState;
  let vaultPassword: string;
  if (passwordRemembered) {
    const passwordEncryptedObj = await browser.storage.session.get(
      vaultSession.id
    );

    const passphraseEncrypted: string = passwordEncryptedObj[vaultSession.id];

    if (!passphraseEncrypted) {
      throw Error("Password not found");
    }

    const decryptPassphrase = new Passphrase(PASSPHRASE);
    vaultPassword = await webEncryptionService.decrypt(
      decryptPassphrase,
      passphraseEncrypted
    );
  } else {
    vaultPassword = arg.vaultPassword;
  }

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
      vaultPassword: string;
    },
    context
  ) => {
    const {
      vault: { vaultSession },
    } = context.getState() as RootState;
    const { vaultPassword, serializedAccount } = args;
    const account = AccountReference.deserialize(serializedAccount);
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
  vaultPassword: string;
  accountPassword: string;
}

export const getPrivateKeyOfAccount = createAsyncThunk<
  string,
  GetPrivateKeyParam
>("vault/getPrivateKeyOfAccount", async (arg, context) => {
  const state = context.getState() as RootState;
  const sessionId = state.vault.vaultSession.id;

  const accountPassphrase = new Passphrase(arg.accountPassword);
  const vaultPassphrase = new Passphrase(arg.vaultPassword);
  return await ExtensionVaultInstance.getAccountPrivateKey(
    sessionId,
    vaultPassphrase,
    AccountReference.deserialize(arg.account),
    accountPassphrase
  );
});

export interface SendTransferParam
  extends Omit<TransferOptions, "transactionParams"> {
  transactionParams: {
    maxFeePerGas?: number;
    maxPriorityFeePerGas?: number;
    data?: string;
    fee?: number;
    memo?: string;
  };
}

export const sendTransfer = createAsyncThunk<string, SendTransferParam>(
  "vault/sendTransfer",
  async (transferOptions, context) => {
    const state = context.getState() as RootState;
    const sessionId = state.vault.vaultSession.id;

    const result = await ExtensionVaultInstance.transferFunds(sessionId, {
      ...transferOptions,
      transactionParams: {
        from: "",
        to: "",
        amount: "",
        ...transferOptions.transactionParams,
      },
    });

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

    if (!action.meta.arg.replace) {
      state.accounts.push(accountReference);
    } else {
      state.accounts = state.accounts.map((a) =>
        a.address === accountReference.address &&
        a.protocol === accountReference.protocol
          ? accountReference
          : a
      );
    }

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
  builder.addCase(getPrivateKeyOfAccount.fulfilled, (state, action) => {
    resetWrongPasswordCounter(action.meta.arg.account.id, state);
    resetWrongPasswordCounter(VAULT_PASSWORD_ID, state);
  });
  builder.addCase(getPrivateKeyOfAccount.rejected, (state, action) => {
    increaseWrongPasswordCounter(
      action.meta.arg.account.id,
      state,
      action.error
    );
    increaseWrongPasswordCounter(VAULT_PASSWORD_ID, state, action.error);
  });
};

const addSendTransferToBuilder = (builder: VaultSliceBuilder) => {
  builder.addCase(sendTransfer.fulfilled, (state, action) => {
    if (action.meta.arg.from.type === SupportedTransferOrigins.VaultAccountId) {
      resetWrongPasswordCounter(action.meta.arg.from.value, state);
    }
  });

  builder.addCase(sendTransfer.rejected, (state, action) => {
    if (action.meta.arg.from.type === SupportedTransferOrigins.VaultAccountId) {
      increaseWrongPasswordCounter(
        action.meta.arg.from.value,
        state,
        action.error
      );
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
    error.name === VaultRestoreError.name ||
    error.name === PrivateKeyRestoreError.name
  ) {
    const currentCounter = state.wrongPasswordCounter[id];

    if (currentCounter === MAX_PASSWORDS_TRIES) {
      ExtensionVaultInstance.lockVault();
      state.vaultSession = null;
      state.isUnlockedStatus = "locked_due_wrong_password";
      state.passwordRemembered = false;
      state.accounts = [];
      state.sessions = [];
      state.wrongPasswordCounter = {};
      return;
    }

    state.wrongPasswordCounter[id] =
      typeof currentCounter === "number" ? currentCounter + 1 : 1;
  }
}
