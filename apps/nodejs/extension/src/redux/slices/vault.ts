import type { ChainID } from "@poktscan/keyring/dist/lib/core/common/IProtocol";
import type {
  AccountUpdateOptions,
  AssetOptions,
  NetworkOptions,
  SerializedAccountReference,
  SerializedAsset,
  SerializedNetwork,
  SerializedSession,
} from "@poktscan/keyring";
import {
  Asset,
  ExternalAccessRequest,
  Network,
  Passphrase,
  SupportedProtocols,
} from "@poktscan/keyring";
import type { Protocol } from "@poktscan/keyring/dist/lib/core/common/Protocol";
import type { RootState } from "../store";
import type { DisconnectBackResponse } from "../../types/communication";
import { v4 } from "uuid";
import browser from "webextension-polyfill";
import {
  createAsyncThunk,
  createSlice,
  PayloadAction,
  SerializedError,
} from "@reduxjs/toolkit";
import { WebEncryptionService } from "@poktscan/keyring-encryption-web";
import { AssetStorage, getVault, NetworkStorage, wait } from "../../utils";
import {
  getAccountBalance as getBalance,
  getBalances,
  getFee,
} from "../../utils/networkOperations";
import { DISCONNECT_RESPONSE } from "../../constants/communication";

const MAX_PASSWORDS_TRIES = 4;
const VAULT_PASSWORD_ID = "vault";

const webEncryptionService = new WebEncryptionService();
const ExtensionVaultInstance = getVault();

type InitializeStatus = "loading" | "exists" | "none";

export interface NetworkOperations {
  fee: number;
  balance: number;
  transfer: number;
}

export interface ErrorsPreferredNetwork {
  [SupportedProtocols.Pocket]: Record<
    ChainID<SupportedProtocols.Pocket>,
    NetworkOperations
  >;
  [SupportedProtocols.Unspecified]: Record<
    ChainID<SupportedProtocols.Unspecified>,
    NetworkOperations
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

    return {
      passwordRemembered: remember,
      session: session.serialize(),
      entities: {
        sessions: sessions
          .filter((item) => item.isValid())
          .map((item) => item.serialize()),
        networks: networks.concat(),
        assets: assets.concat(),
        accounts: accounts.map((item) => item.serialize()),
      },
    };
  }
);

export const getProtocolFee = createAsyncThunk<
  {
    fee: number;
    errorUsingPreferred: boolean;
  },
  Protocol
>("vault/getProtocolFee", async (protocol, context) => {
  const {
    errorsPreferredNetwork,
    entities: {
      networks: { list },
    },
  } = (context.getState() as RootState).vault;

  return getFee(protocol, list, errorsPreferredNetwork);
});

interface GetAccountBalanceParam {
  address: string;
  protocol: Protocol;
}

interface GetAccountBalanceResult {
  address: string;
  amount: number;
  update: boolean;
  errorUsingPreferred: boolean;
}

export const getAccountBalance = createAsyncThunk<
  GetAccountBalanceResult,
  GetAccountBalanceParam
>("vault/getAccountBalance", async ({ address, protocol }, { getState }) => {
  let counter = 1;

  while (counter <= 5) {
    const state = getState() as RootState;
    const isLoading = state.vault.entities.accounts.balances.loading;

    if (isLoading) {
      await wait(100);
      counter++;
    } else {
      counter = 6;
    }
  }

  const state = getState() as RootState;
  const map = state.vault.entities.accounts.balances.byId;
  const networks = state.vault.entities.networks.list;
  const errorsPreferredNetwork = state.vault.errorsPreferredNetwork;

  const accountFromSaved = state.vault.entities.accounts.list.find(
    (item) => item.address === address
  );

  if (accountFromSaved && map[accountFromSaved.id]) {
    const value = map[accountFromSaved.id];

    if (value.lastUpdatedAt > new Date().getTime() - 60000) {
      return {
        address,
        amount: value.amount,
        update: false,
        errorUsingPreferred: false,
      };
    }
  }

  const result = await getBalance(
    address,
    protocol,
    networks,
    errorsPreferredNetwork
  );

  return {
    address,
    amount: result.balance,
    update: !!accountFromSaved,
    errorUsingPreferred: result.errorUsingPreferred,
  };
});

export const getAllBalances = createAsyncThunk<{
  newErrorsCounter: ErrorsPreferredNetwork;
  newBalanceMap: VaultSlice["entities"]["accounts"]["balances"]["byId"];
}>("vault/getAllBalances", async (_, { getState }) => {
  const state = getState() as RootState;

  const accounts = state.vault.entities.accounts.list;
  const networks = state.vault.entities.networks.list;
  const map = state.vault.entities.accounts.balances.byId;
  const errorsPreferredNetwork = state.vault.errorsPreferredNetwork;

  const accountsToGetBalance: SerializedAccountReference[] = [];
  const idByAccount: Record<string, string> = {};

  for (const account of accounts) {
    const {
      id,
      address,
      protocol: { chainID, name },
    } = account;
    if (map[id]) {
      const value = map[id];

      if (value.lastUpdatedAt > new Date().getTime() - 60000) {
        continue;
      }
    }

    accountsToGetBalance.push({ ...account });
    idByAccount[`${address}_${name}_${chainID}`] = account.id;
  }

  const response = await getBalances(
    accountsToGetBalance,
    networks,
    errorsPreferredNetwork
  );
  const lastUpdatedAt = new Date().getTime();

  const resultConvertedToMap = response.reduce(
    (acc, { address, balance, protocol: { chainID, name } }) => ({
      ...acc,
      [idByAccount[`${address}_${name}_${chainID}`]]: {
        amount: balance,
        lastUpdatedAt,
      },
    }),
    {}
  );

  const newErrorsCounter = { ...errorsPreferredNetwork };

  response.forEach((item) => {
    if (item.errorUsingPreferred) {
      const {
        protocol: { name, chainID },
      } = item;
      newErrorsCounter[name][chainID]["balance"]++;
    }
  });

  return {
    newBalanceMap: {
      ...map,
      ...resultConvertedToMap,
    },
    newErrorsCounter,
  };
});

export const addNewAccount = createAsyncThunk<
  {
    accountReference: SerializedAccountReference;
    session: SerializedSession;
  },
  {
    sessionId?: string;
    password: string;
    name: string;
    asset: SerializedAsset;
    vaultPassword?: string;
  }
>("vault/addNewAccount", async (args, context) => {
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
      asset: Asset.deserialize(args.asset),
      passphrase: accountPassphrase,
    }
  );

  const updatedSession = await ExtensionVaultInstance.getSession(session);

  return {
    accountReference: accountReference.serialize(),
    session: updatedSession.serialize(),
  };
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
  { options: NetworkOptions; id?: string }
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
  if (error.name === "PassphraseIncorrectError") {
    const currentCounter = state.wrongPasswordCounter[VAULT_PASSWORD_ID];

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

    state.wrongPasswordCounter[VAULT_PASSWORD_ID] =
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
      ["mainnet"]: {
        fee: 0,
        balance: 0,
        transfer: 0,
      },
      ["testnet"]: {
        fee: 0,
        balance: 0,
        transfer: 0,
      },
    },
    [SupportedProtocols.Unspecified]: {
      ["unspecified"]: {
        fee: 0,
        balance: 0,
        transfer: 0,
      },
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
    increaseErrorPreferredNetwork: (
      state,
      action: PayloadAction<{
        protocol: SupportedProtocols;
        chainID: ChainID<SupportedProtocols>;
        operation: keyof NetworkOperations;
      }>
    ) => {
      const { protocol, chainID, operation } = action.payload;
      state.errorsPreferredNetwork[protocol][chainID][operation]++;
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

    builder.addCase(initVault.fulfilled, (state) => {
      state.initializeStatus = "exists";
    });

    builder.addCase(checkInitializeStatus.fulfilled, (state, action) => {
      state.initializeStatus = action.payload;
    });

    builder.addCase(loadSessions.pending, (state) => {
      state.entities.sessions.loading = true;
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

    //accounts: updateAccount
    builder.addCase(updateAccount.pending, (state) => {
      state.entities.accounts.loading = true;
    });

    builder.addCase(updateAccount.rejected, (state, action) => {
      state.entities.accounts.loading = false;

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

    //balances
    builder.addCase(getAccountBalance.fulfilled, (state, action) => {
      const result = action.payload;

      if (result) {
        const { address, amount, update, errorUsingPreferred } = result;
        if (update) {
          state.entities.accounts.balances.byId[address] = {
            lastUpdatedAt: new Date().getTime(),
            amount,
          };
        }

        if (errorUsingPreferred) {
          const { name, chainID } = action.meta.arg.protocol;
          state.errorsPreferredNetwork[name][chainID]["balance"]++;
        }
      }
    });

    builder.addCase(getAllBalances.pending, (state) => {
      state.entities.accounts.balances.loading = true;
    });
    builder.addCase(getAllBalances.rejected, (state) => {
      state.entities.accounts.balances.loading = false;
    });
    builder.addCase(getAllBalances.fulfilled, (state, action) => {
      const result = action.payload;
      if (result) {
        state.entities.accounts.balances.loading = false;
        state.entities.accounts.balances.byId = action.payload.newBalanceMap;
        state.errorsPreferredNetwork = action.payload.newErrorsCounter;
      }
    });

    builder.addCase(getProtocolFee.fulfilled, (state, action) => {
      if (action.payload.errorUsingPreferred) {
        const { name, chainID } = action.meta.arg;
        state.errorsPreferredNetwork[name][chainID]["fee"]++;
      }
    });
  },
});

export const { lockVault, increaseErrorPreferredNetwork } = vaultSlice.actions;

export default vaultSlice.reducer;
