import type {
  AssetOptions,
  NetworkOptions,
  SerializedAsset,
  SerializedNetwork,
  SerializedSession,
  SerializedAccountReference,
  AccountUpdateOptions,
} from "@poktscan/keyring";
import type { RootState } from "../store";
import type { DisconnectBackResponse } from "../../types/communication";
import { v4 } from "uuid";
import browser from "webextension-polyfill";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  Asset,
  ExternalAccessRequest,
  Network,
  Passphrase,
} from "@poktscan/keyring";
import { WebEncryptionService } from "@poktscan/keyring-encryption-web";
import { AssetStorage, getVault, NetworkStorage } from "../../utils";
import { DISCONNECT_RESPONSE } from "../../constants/communication";

const webEncryptionService = new WebEncryptionService();
const ExtensionVaultInstance = getVault();

type InitializeStatus = "loading" | "exists" | "none";

export interface VaultSlice {
  initializeStatus?: InitializeStatus;
  isUnlockedStatus: "no" | "yes" | "unlocking";
  vaultSession: SerializedSession | null;
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
    };
  };
}

export const VAULT_HAS_BEEN_INITIALIZED_KEY = "vault_has_been_initialized";
export const PASSPHRASE = v4();

export const unlockVault = createAsyncThunk(
  "vault/unlockVault",
  async (password: string) => {
    const session = await ExtensionVaultInstance.unlockVault(password);
    const passphrase = new Passphrase(PASSPHRASE);

    const passwordEncrypted = await webEncryptionService.encrypt(
      passphrase,
      password
    );

    const [sessions, networks, assets, accounts] = await Promise.all([
      ExtensionVaultInstance.listSessions(session.id),
      NetworkStorage.list(),
      AssetStorage.list(),
      ExtensionVaultInstance.listAccounts(session.id),
      // @ts-ignore
      (browser.storage.session as typeof browser.storage.local).set({
        [session.id]: passwordEncrypted,
      }),
    ]);

    return {
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
  }
>("vault/addNewAccount", async (args, context) => {
  const {
    vault: { vaultSession },
  } = context.getState() as RootState;
  const passwordEncryptedObj = await // @ts-ignore
  (browser.storage.session as typeof browser.storage.local).get(
    vaultSession.id
  );

  const passphraseEncrypted: string = passwordEncryptedObj[vaultSession.id];

  if (!passphraseEncrypted) {
    throw Error("Password not found");
  }

  const decryptPassphrase = new Passphrase(PASSPHRASE);
  const passphraseDecrypted = await webEncryptionService.decrypt(
    decryptPassphrase,
    passphraseEncrypted
  );

  const session = args.sessionId || vaultSession.id;
  const vaultPassphrase = new Passphrase(passphraseDecrypted);
  const accountPassphrase = new Passphrase(args.password);

  const accountReference = await ExtensionVaultInstance.createAccount(
    session,
    vaultPassphrase,
    {
      name: args.name,
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
  AccountUpdateOptions
>("vault/updateAccount", async (arg, context) => {
  const {
    vault: { vaultSession },
  } = context.getState() as RootState;

  const passwordEncryptedObj = await // @ts-ignore
  (browser.storage.session as typeof browser.storage.local).get(
    vaultSession.id
  );

  const passphraseEncrypted: string = passwordEncryptedObj[vaultSession.id];

  const decryptPassphrase = new Passphrase(PASSPHRASE);
  const passphraseDecrypted = await webEncryptionService.decrypt(
    decryptPassphrase,
    passphraseEncrypted
  );
  const vaultPassphrase = new Passphrase(passphraseDecrypted);

  const accountReference = await ExtensionVaultInstance.updateAccountName(
    vaultSession.id,
    vaultPassphrase,
    arg
  );

  return accountReference.serialize();
});

export const initVault = createAsyncThunk<void, string>(
  "vault/initVault",
  async (password: string) => {
    await ExtensionVaultInstance.initializeVault(password).then(() => {
      return browser.storage.local.set({
        [VAULT_HAS_BEEN_INITIALIZED_KEY]: "true",
      });
    });
  }
);

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

const emptyEntities = {
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
  },
};

const initialState: VaultSlice = {
  vaultSession: null,
  initializeStatus: "loading",
  isUnlockedStatus: "no",
  entities: {
    ...emptyEntities,
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

      state.entities = { ...emptyEntities };
    },
  },
  extraReducers: (builder) => {
    builder.addCase(unlockVault.fulfilled, (state, action) => {
      const {
        session,
        entities: { sessions, networks, assets, accounts },
      } = action.payload;
      state.vaultSession = session;
      state.isUnlockedStatus = "yes";

      state.entities.sessions.list = sessions;
      state.entities.networks.list = networks;
      state.entities.assets.list = [...assets];
      state.entities.accounts.list = accounts;
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
    });

    //accounts: updateAccount
    builder.addCase(updateAccount.pending, (state) => {
      state.entities.accounts.loading = true;
    });

    builder.addCase(updateAccount.rejected, (state) => {
      state.entities.accounts.loading = false;
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
    });
  },
});

export const { lockVault } = vaultSlice.actions;

export default vaultSlice.reducer;
