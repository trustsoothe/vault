import type {
  AssetOptions,
  NetworkOptions,
  SerializedAsset,
  SerializedNetwork,
  SerializedSession,
} from "@poktscan/keyring";
import browser from "webextension-polyfill";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { AssetStorage, getVault, NetworkStorage } from "../../utils";
import { RootState } from "../store";
import { Asset, ExternalAccessRequest, Network } from "@poktscan/keyring";
import { WebEncryptionService } from "@poktscan/keyring-encryption-web";

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
  };
}

export const VAULT_HAS_BEEN_INITIALIZED_KEY = "vault_has_been_initialized";

export const unlockVault = createAsyncThunk(
  "vault/unlockVault",
  async (password: string) => {
    const session = await ExtensionVaultInstance.unlockVault(password);

    // const passwordEncrypted = await webEncryptionService.encrypt(
    //   session.id,
    //   password
    // );

    const [sessions, networks, assets] = await Promise.all([
      ExtensionVaultInstance.listSessions(session.id),
      NetworkStorage.list(),
      AssetStorage.list(),
      // browser.storage.local.set({ [session.id]: passwordEncrypted }),
    ]);

    return {
      session: session.serialize(),
      entities: {
        sessions: sessions
          .filter((item) => item.isValid())
          .map((item) => item.serialize()),
        networks: networks.concat(),
        assets: assets.concat(),
      },
    };
  }
);

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
  console.log("where am i?");
  const session = await ExtensionVaultInstance.authorizeExternal(request);
  return session.serialize();
});

export const revokeSession = createAsyncThunk<SerializedSession[], string>(
  "vault/revokeSession",
  async (sessionIdToRevoke, context) => {
    const {
      vault: { vaultSession, entities },
    } = context.getState() as RootState;

    await ExtensionVaultInstance.revokeSession(
      vaultSession.id,
      sessionIdToRevoke
    );

    return entities.sessions.list.filter(
      (item) => item.id !== sessionIdToRevoke
    );
  }
);

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
        entities: { sessions, networks, assets },
      } = action.payload;
      state.vaultSession = session;
      state.isUnlockedStatus = "yes";

      state.entities.sessions.list = sessions;
      state.entities.networks.list = networks;
      state.entities.assets.list = [...assets];
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
  },
});

export const { lockVault } = vaultSlice.actions;

export default vaultSlice.reducer;
