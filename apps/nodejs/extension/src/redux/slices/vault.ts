import type {
  AccountUpdateOptions,
  AssetOptions,
  EthereumNetworkFee,
  INetworkOptions,
  PocketNetworkFee,
  SerializedAccountReference,
  SerializedAsset,
  SerializedNetwork,
  SerializedSession,
} from "@poktscan/keyring";
import {
  AccountReference,
  Asset,
  ExternalAccessRequest,
  Network,
  Passphrase,
  PrivateKeyRestoreError,
  Session,
  SupportedProtocols,
  SupportedTransferOrigins,
  TransferOptions,
  VaultRestoreError,
} from "@poktscan/keyring";
import type { RootState } from "../store";
import type { DisconnectBackResponse } from "../../types/communication";
import { v4 } from "uuid";
import browser from "webextension-polyfill";
import {
  createAsyncThunk,
  createSlice,
  SerializedError,
} from "@reduxjs/toolkit";
import { WebEncryptionService } from "@poktscan/keyring-encryption-web";
import { AssetStorage, getVault, NetworkStorage } from "../../utils";
import { getFee } from "../../utils/networkOperations";
import { DISCONNECT_RESPONSE } from "../../constants/communication";
import { ChainID } from "@poktscan/keyring/dist/lib/core/common/protocols/ChainID";

const MAX_PASSWORDS_TRIES = 4;
const VAULT_PASSWORD_ID = "vault";

const webEncryptionService = new WebEncryptionService();
const ExtensionVaultInstance = getVault();

type InitializeStatus = "loading" | "exists" | "none";

export type ErrorsByNetwork = Record<string, number>;

export interface ErrorsPreferredNetwork {
  [SupportedProtocols.Pocket]: Record<
    ChainID<SupportedProtocols.Pocket>,
    ErrorsByNetwork
  >;
  [SupportedProtocols.Unspecified]: Record<
    ChainID<SupportedProtocols.Unspecified>,
    ErrorsByNetwork
  >;
}

export interface VaultSlice {
  initializeStatus?: InitializeStatus;
  isUnlockedStatus: "no" | "yes" | "unlocking" | "locked_due_wrong_password";
  passwordRemembered: boolean;
  vaultSession: SerializedSession | null;
  wrongPasswordCounter: Record<string, number>;
  errorsPreferredNetwork?: ErrorsPreferredNetwork;
  entities: {
    sessions: {
      loading: boolean;
      list: SerializedSession[];
    };
    networks: {
      loading: boolean;
      list: SerializedNetwork[];
    };
    assets: {
      loading: boolean;
      list: SerializedAsset[];
    };
    accounts: {
      loading: boolean;
      list: SerializedAccountReference[];
      balances: {
        loading: boolean;
        byId: Record<
          string,
          {
            amount: number;
            lastUpdatedAt: number;
            error?: boolean;
            loading?: boolean;
          }
        >;
      };
    };
  };
}

export const VAULT_HAS_BEEN_INITIALIZED_KEY = "vault_has_been_initialized";
export const PASSPHRASE = v4();

export const unlockVault = createAsyncThunk(
  "vault/unlockVault",
  async ({ password, remember }: { password: string; remember: boolean }) => {
    const session = await ExtensionVaultInstance.unlockVault(password);

    let passwordEncrypted: string;
    if (remember) {
      const passphrase = new Passphrase(PASSPHRASE);

      passwordEncrypted = await webEncryptionService.encrypt(
        passphrase,
        password
      );
    }

    const [sessions, networks, assets, accounts] = await Promise.all([
      ExtensionVaultInstance.listSessions(session.id),
      NetworkStorage.list(),
      AssetStorage.list(),
      ExtensionVaultInstance.listAccounts(session.id),
      ...(remember
        ? [
            browser.storage.session.set({
              [session.id]: passwordEncrypted,
            }),
          ]
        : []),
    ]);

    const accountsSerialized = accounts.map((item) => item.serialize());

    return {
      passwordRemembered: remember,
      session: session.serialize(),
      entities: {
        sessions: sessions
          .filter((item) => item.isValid())
          .map((item) => item.serialize()),
        networks: networks.concat(),
        assets: assets.concat(),
        accounts: accountsSerialized,
      },
    };
  }
);

export const getProtocolFee = createAsyncThunk<
  {
    fee: PocketNetworkFee | EthereumNetworkFee;
    networksWithErrors: string[];
  },
  {
    protocol: SupportedProtocols;
    chainId: ChainID<SupportedProtocols>;
  }
>("vault/getProtocolFee", async ({ protocol, chainId }, context) => {
  const {
    entities: {
      networks: { list },
    },
  } = (context.getState() as RootState).vault;

  return await getFee({
    protocol,
    chainId,
    networks: list,
    errorsPreferredNetwork: (context.getState() as RootState).app
      .errorsPreferredNetwork,
    options: undefined,
  });
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
        to: transferOptions.to.value,
        amount: "",
        ...transferOptions.transactionParams,
      },
    });

    return result.transactionHash;
  }
);

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

export const initVault = createAsyncThunk<
  void,
  { password: string; remember: boolean }
>("vault/initVault", async ({ password, remember }, { dispatch }) => {
  await ExtensionVaultInstance.initializeVault(password).then(() => {
    return browser.storage.local.set({
      [VAULT_HAS_BEEN_INITIALIZED_KEY]: "true",
    });
  });
  await dispatch(unlockVault({ password, remember })).unwrap();
});

export const checkInitializeStatus = createAsyncThunk<InitializeStatus>(
  "vault/checkInitializeStatus",
  async () => {
    return browser.storage.local
      .get(VAULT_HAS_BEEN_INITIALIZED_KEY)
      .then((result) => {
        return result[VAULT_HAS_BEEN_INITIALIZED_KEY] === "true"
          ? "exists"
          : "none";
      });
  }
);

export const loadSessions = createAsyncThunk<SerializedSession[]>(
  "vault/loadSessions",
  async (_: never, context) => {
    const {
      vault: { vaultSession },
    } = context.getState() as RootState;

    const sessions = await ExtensionVaultInstance.listSessions(vaultSession.id);

    return sessions.map((item) => item.serialize());
  }
);

export const authorizeExternalSession = createAsyncThunk<
  SerializedSession,
  ExternalAccessRequest
>("vault/AuthorizeExternalSession", async (request) => {
  const session = await ExtensionVaultInstance.authorizeExternal(request);
  return session.serialize();
});

export const revokeAllExternalSessions = createAsyncThunk(
  "vault/revokeAllExternalSessions",
  async (_, context) => {
    const {
      vault: { vaultSession, entities },
    } = context.getState() as RootState;

    const activeSessions = entities.sessions.list
      .map((session) => Session.deserialize(session))
      .filter((session) => session.isValid() && !!session.origin?.value);

    for (const session of activeSessions) {
      const [tabsWithOrigin] = await Promise.all([
        browser.tabs.query({
          url: `${session.origin.value}/*`,
        }),
        ExtensionVaultInstance.revokeSession(vaultSession.id, session.id),
      ]);

      if (tabsWithOrigin.length) {
        const response: DisconnectBackResponse = {
          type: DISCONNECT_RESPONSE,
          data: {
            disconnected: true,
          },
          error: null,
        };

        await Promise.allSettled(
          tabsWithOrigin.map((tab) =>
            browser.tabs.sendMessage(tab.id, response)
          )
        );
      }
    }

    const allSessions = await ExtensionVaultInstance.listSessions(
      vaultSession.id
    );

    return allSessions
      .filter((item) => item.isValid())
      .map((item) => item.serialize());
  }
);

export const revokeSession = createAsyncThunk<
  SerializedSession[],
  { sessionId: string; external: boolean }
>("vault/revokeSession", async ({ sessionId, external }, context) => {
  const {
    vault: { vaultSession, entities },
  } = context.getState() as RootState;

  await ExtensionVaultInstance.revokeSession(
    external ? sessionId : vaultSession.id,
    sessionId
  );

  let revokedSession: SerializedSession;

  const sessions = entities.sessions.list.filter((item) => {
    if (item.id === sessionId) {
      revokedSession = item;
    }
    return item.id !== sessionId;
  });

  if (revokedSession) {
    const origin = revokedSession.origin;

    if (origin) {
      const tabsWithOrigin = await browser.tabs.query({ url: `${origin}/*` });

      if (tabsWithOrigin.length) {
        const response: DisconnectBackResponse = {
          type: DISCONNECT_RESPONSE,
          data: {
            disconnected: true,
          },
          error: null,
        };

        await Promise.allSettled(
          tabsWithOrigin.map((tab) =>
            browser.tabs.sendMessage(tab.id, response)
          )
        );
      }
    }
  }

  return sessions;
});

export const saveNetwork = createAsyncThunk<
  SerializedNetwork,
  { options: INetworkOptions<SupportedProtocols>; id?: string }
>("vault/saveNetwork", async (args) => {
  const { id, options } = args;
  const network = new Network(options, id);
  await NetworkStorage.save(network.serialize());
  return network.serialize();
});

export const removeNetwork = createAsyncThunk<string, string>(
  "vault/removeNetwork",
  async (networkId) => {
    await NetworkStorage.remove(networkId);
    return networkId;
  }
);

export const saveAsset = createAsyncThunk<
  SerializedAsset,
  { options: AssetOptions; id?: string }
>("vault/saveAsset", async (args) => {
  const { id, options } = args;
  const asset = new Asset(options, id);
  await AssetStorage.save(asset.serialize());
  return asset.serialize();
});

export const removeAsset = createAsyncThunk<string, string>(
  "vault/removeAsset",
  async (assetId) => {
    await AssetStorage.remove(assetId);
    return assetId;
  }
);

const resetWrongPasswordCounter = (id: string, state: VaultSlice) => {
  state.wrongPasswordCounter[id] = undefined;
};

const increaseWrongPasswordCounter = (
  id: string,
  state: VaultSlice,
  error: SerializedError
) => {
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
      state.entities = { ...emptyEntities };
      state.wrongPasswordCounter = {};
      state.errorsPreferredNetwork = { ...initialState.errorsPreferredNetwork };
      return;
    }

    state.wrongPasswordCounter[id] =
      typeof currentCounter === "number" ? currentCounter + 1 : 1;
  }
};

const emptyEntities: VaultSlice["entities"] = {
  sessions: {
    loading: false,
    list: [],
  },
  networks: {
    loading: false,
    list: [],
  },
  assets: {
    loading: false,
    list: [],
  },
  accounts: {
    loading: false,
    list: [],
    balances: {
      loading: false,
      byId: {},
    },
  },
};

const initialState: VaultSlice = {
  vaultSession: null,
  passwordRemembered: false,
  initializeStatus: "loading",
  isUnlockedStatus: "no",
  entities: {
    ...emptyEntities,
  },
  wrongPasswordCounter: {},
  errorsPreferredNetwork: {
    [SupportedProtocols.Pocket]: {
      ["mainnet"]: {},
      ["testnet"]: {},
    },
    [SupportedProtocols.Unspecified]: {
      ["unspecified"]: {},
    },
  },
};

const vaultSlice = createSlice({
  name: "vault",
  initialState,
  reducers: {
    lockVault: (state) => {
      ExtensionVaultInstance.lockVault();
      state.vaultSession = null;
      state.isUnlockedStatus = "no";
      state.passwordRemembered = false;
      state.entities = { ...emptyEntities };
      state.wrongPasswordCounter = {};
      state.errorsPreferredNetwork = { ...initialState.errorsPreferredNetwork };
    },
  },
  extraReducers: (builder) => {
    builder.addCase(unlockVault.fulfilled, (state, action) => {
      const {
        session,
        entities: { sessions, networks, assets, accounts },
        passwordRemembered,
      } = action.payload;
      state.vaultSession = session;
      state.isUnlockedStatus = "yes";

      state.entities.sessions.list = sessions;
      state.entities.networks.list = networks;
      state.entities.assets.list = [...assets];
      state.entities.accounts.list = accounts;
      state.passwordRemembered = passwordRemembered;
    });
    builder.addCase(unlockVault.rejected, (state, action) => {
      console.log("ERROR UNLOCKING VAULT:", action.error);
    });

    builder.addCase(initVault.fulfilled, (state) => {
      state.initializeStatus = "exists";
    });

    builder.addCase(checkInitializeStatus.fulfilled, (state, action) => {
      state.initializeStatus = action.payload;
    });

    builder.addCase(loadSessions.pending, (state) => {
      state.entities.sessions.loading = true;
    });

    builder.addCase(revokeAllExternalSessions.pending, (state) => {
      state.entities.sessions.loading = true;
    });

    builder.addCase(revokeAllExternalSessions.rejected, (state) => {
      state.entities.sessions.loading = false;
    });

    builder.addCase(revokeAllExternalSessions.fulfilled, (state, action) => {
      state.entities.sessions.loading = false;
      state.entities.sessions.list = action.payload;
    });

    builder.addCase(revokeSession.pending, (state) => {
      state.entities.sessions.loading = true;
    });

    builder.addCase(revokeSession.rejected, (state, action) => {
      console.log("REJECTED REVOKE:", action);
      state.entities.sessions.loading = false;
    });

    builder.addCase(loadSessions.fulfilled, (state, action) => {
      state.entities.sessions.loading = false;
      state.entities.sessions.list = action.payload;
    });

    builder.addCase(revokeSession.fulfilled, (state, action) => {
      state.entities.sessions.loading = false;
      state.entities.sessions.list = action.payload;
    });

    builder.addCase(authorizeExternalSession.pending, (state) => {
      state.entities.sessions.loading = true;
    });

    builder.addCase(authorizeExternalSession.rejected, (state, action) => {
      console.log("REJECTED AUTHORIZED:", action);
      state.entities.sessions.loading = false;
    });

    builder.addCase(authorizeExternalSession.fulfilled, (state, action) => {
      state.entities.sessions.loading = false;
      state.entities.sessions.list.push(action.payload);
    });

    // network: saveNetwork
    builder.addCase(saveNetwork.pending, (state) => {
      state.entities.networks.loading = true;
    });

    builder.addCase(saveNetwork.rejected, (state) => {
      state.entities.networks.loading = false;
    });

    builder.addCase(saveNetwork.fulfilled, (state, action) => {
      const isUpdating = !!action.meta.arg.id;
      const network = action.payload;

      if (isUpdating) {
        const index = state.entities.networks.list.findIndex(
          (item) => item.id === network.id
        );

        if (index !== -1) {
          state.entities.networks.list.splice(index, 1, network);
        }
      } else {
        state.entities.networks.list.push(network);
      }
    });

    // network: removeNetwork
    builder.addCase(removeNetwork.pending, (state) => {
      state.entities.networks.loading = true;
    });

    builder.addCase(removeNetwork.rejected, (state) => {
      state.entities.networks.loading = false;
    });

    builder.addCase(removeNetwork.fulfilled, (state, action) => {
      const removedNetworkId = action.payload;

      state.entities.networks.list = state.entities.networks.list.filter(
        (item) => item.id !== removedNetworkId
      );
    });

    // asset: saveAsset
    builder.addCase(saveAsset.pending, (state) => {
      state.entities.assets.loading = true;
    });

    builder.addCase(saveAsset.rejected, (state) => {
      state.entities.assets.loading = false;
    });

    builder.addCase(saveAsset.fulfilled, (state, action) => {
      const isUpdating = !!action.meta.arg.id;
      const asset = action.payload;

      if (isUpdating) {
        const index = state.entities.assets.list.findIndex(
          (item) => item.id === asset.id
        );

        if (index !== -1) {
          state.entities.assets.list.splice(index, 1, asset);
        }
      } else {
        state.entities.assets.list.push(asset);
      }
    });

    // network: removeNetwork
    builder.addCase(removeAsset.pending, (state) => {
      state.entities.assets.loading = true;
    });

    builder.addCase(removeAsset.rejected, (state) => {
      state.entities.assets.loading = false;
    });

    builder.addCase(removeAsset.fulfilled, (state, action) => {
      const removedAssetId = action.payload;

      state.entities.assets.list = state.entities.assets.list.filter(
        (item) => item.id !== removedAssetId
      );
    });

    //accounts: addNewAccount
    builder.addCase(addNewAccount.pending, (state) => {
      state.entities.accounts.loading = true;
    });

    builder.addCase(addNewAccount.rejected, (state, action) => {
      console.log("ADD_NEW_ACCOUNT", action);
      state.entities.accounts.loading = false;

      increaseWrongPasswordCounter(VAULT_PASSWORD_ID, state, action.error);
    });

    builder.addCase(addNewAccount.fulfilled, (state, action) => {
      const { accountReference, session } = action.payload;
      state.entities.accounts.loading = false;
      state.entities.accounts.list.push(accountReference);

      const index = state.entities.sessions.list.findIndex(
        (item) => item.id === session.id
      );

      if (index !== -1) {
        state.entities.sessions.list.splice(index, 1, session);
      }

      resetWrongPasswordCounter(VAULT_PASSWORD_ID, state);
    });

    // accounts: import
    builder.addCase(importAccount.pending, (state) => {
      state.entities.accounts.loading = true;
    });

    builder.addCase(importAccount.rejected, (state, action) => {
      console.log("IMPORT ACCOUNT ERR:", action.error);
      state.entities.accounts.loading = false;

      increaseWrongPasswordCounter(VAULT_PASSWORD_ID, state, action.error);
    });

    builder.addCase(importAccount.fulfilled, (state, action) => {
      const accountReference = action.payload;
      state.entities.accounts.loading = false;

      if (!action.meta.arg.replace) {
        state.entities.accounts.list.push(accountReference);
      } else {
        state.entities.accounts.list = state.entities.accounts.list.map((a) =>
          a.address === accountReference.address &&
          a.protocol === accountReference.protocol
            ? accountReference
            : a
        );
      }

      resetWrongPasswordCounter(VAULT_PASSWORD_ID, state);
    });

    //accounts: updateAccount
    builder.addCase(updateAccount.pending, (state) => {
      state.entities.accounts.loading = true;
    });

    builder.addCase(updateAccount.rejected, (state, action) => {
      state.entities.accounts.loading = false;

      increaseWrongPasswordCounter(VAULT_PASSWORD_ID, state, action.error);
    });

    //accounts: remove account
    builder.addCase(removeAccount.fulfilled, (state, action) => {
      const accountId = action.meta.arg.serializedAccount.id;

      state.entities.accounts.list = state.entities.accounts.list.filter(
        (item) => item.id !== accountId
      );

      resetWrongPasswordCounter(VAULT_PASSWORD_ID, state);
    });

    builder.addCase(removeAccount.rejected, (state, action) => {
      increaseWrongPasswordCounter(VAULT_PASSWORD_ID, state, action.error);
    });

    builder.addCase(updateAccount.fulfilled, (state, action) => {
      const account = action.payload;

      state.entities.accounts.loading = false;

      const index = state.entities.accounts.list.findIndex(
        (item) => item.id === account.id
      );

      if (index !== -1) {
        state.entities.accounts.list.splice(index, 1, account);
      }

      resetWrongPasswordCounter(VAULT_PASSWORD_ID, state);
    });

    builder.addCase(getProtocolFee.fulfilled, (state, action) => {
      const { networksWithErrors } = action.payload;
      if (networksWithErrors.length) {
        const { protocol, chainId } = action.meta.arg;

        for (const networkId of networksWithErrors) {
          if (state.errorsPreferredNetwork[protocol][chainId][networkId]) {
            state.errorsPreferredNetwork[protocol][chainId][networkId]++;
          } else {
            state.errorsPreferredNetwork[protocol][chainId][networkId] = 1;
          }
        }
      }
    });

    //private key
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

    // transfer
    builder.addCase(sendTransfer.fulfilled, (state, action) => {
      if (
        action.meta.arg.from.type === SupportedTransferOrigins.VaultAccountId
      ) {
        resetWrongPasswordCounter(action.meta.arg.from.value, state);
      }
    });

    builder.addCase(sendTransfer.rejected, (state, action) => {
      if (
        action.meta.arg.from.type === SupportedTransferOrigins.VaultAccountId
      ) {
        increaseWrongPasswordCounter(
          action.meta.arg.from.value,
          state,
          action.error
        );
      }
    });
  },
});

export const { lockVault } = vaultSlice.actions;

export default vaultSlice.reducer;
