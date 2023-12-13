import type {
  SerializedAccountReference,
  SerializedSession,
} from "@poktscan/keyring";
import type { RootState } from "../../store";
import { v4 } from "uuid";
import browser from "webextension-polyfill";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { Passphrase, VaultRestoreErrorName } from "@poktscan/keyring";
import { WebEncryptionService } from "@poktscan/keyring-encryption-web";
import { AssetStorage, getVault, NetworkStorage } from "../../../utils";
import { addSessionThunksToBuilder } from "./session";
import { addAccountThunksToBuilder } from "./account";

const webEncryptionService = new WebEncryptionService();
const ExtensionVaultInstance = getVault();

type InitializeStatus = "loading" | "exists" | "none";

const LOCKED_VAULT_PASS_ID = "LOCKED_VAULT_PASS";
const MAX_UNLOCK_PASSWORDS_TRIES = 6;

export interface VaultSlice {
  initializeStatus?: InitializeStatus;
  isUnlockedStatus: "no" | "yes" | "unlocking" | "locked_due_wrong_password";
  passwordRemembered: boolean;
  vaultSession: SerializedSession | null;
  wrongPasswordCounter: Record<string, number>;
  accounts: SerializedAccountReference[];
  sessions: SerializedSession[];
  dateUntilVaultIsLocked?: number;
}

export const VAULT_HAS_BEEN_INITIALIZED_KEY = "vault_has_been_initialized";
export const PASSPHRASE = v4();

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

const VaultCannotBeUnlockedError = Object.freeze({
  name: "VaultCannotBeUnlocked",
  message: "The vault cannot be unlocked right now.",
});

export const restoreDateUntilVaultIsLocked = createAsyncThunk(
  "vault/restoreDateUntilVaultIsLocked",
  async () => {
    const response = await browser.storage.local.get(LOCKED_VAULT_PASS_ID);

    return response[LOCKED_VAULT_PASS_ID];
  }
);

export const unlockVault = createAsyncThunk(
  "vault/unlockVault",
  async (
    { password, remember }: { password: string; remember: boolean },
    context
  ) => {
    const state = context.getState() as RootState;
    const dateUntilVaultIsLocked = state.vault.dateUntilVaultIsLocked;

    if (
      dateUntilVaultIsLocked &&
      dateUntilVaultIsLocked > new Date().getTime()
    ) {
      throw VaultCannotBeUnlockedError;
    }

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

// todo: move to app
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

const initialState: VaultSlice = {
  vaultSession: null,
  passwordRemembered: false,
  initializeStatus: "loading",
  isUnlockedStatus: "no",
  wrongPasswordCounter: {},
  accounts: [],
  sessions: [],
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
      state.wrongPasswordCounter = {};
      state.accounts = [];
      state.sessions = [];
    },
  },
  extraReducers: (builder) => {
    addAccountThunksToBuilder(builder);
    addSessionThunksToBuilder(builder);

    builder.addCase(unlockVault.fulfilled, (state, action) => {
      const {
        session,
        entities: { sessions, accounts },
        passwordRemembered,
      } = action.payload;
      state.vaultSession = session;
      state.isUnlockedStatus = "yes";

      state.sessions = sessions;
      state.accounts = accounts;
      state.passwordRemembered = passwordRemembered;

      state.wrongPasswordCounter[LOCKED_VAULT_PASS_ID] = 0;
      state.dateUntilVaultIsLocked = undefined;
    });
    builder.addCase(unlockVault.rejected, (state, action) => {
      debugger;
      if (action.error?.name === VaultRestoreErrorName) {
        const currentCounter =
          state.wrongPasswordCounter[LOCKED_VAULT_PASS_ID] || 0;

        // disable unlock vault for 5 minutes
        if (currentCounter + 1 === MAX_UNLOCK_PASSWORDS_TRIES) {
          const date = Date.now() + 5 * 60 * 1000;
          state.dateUntilVaultIsLocked = date;
          browser.storage.local.set({ [LOCKED_VAULT_PASS_ID]: date }).catch();
        } else if (
          !currentCounter ||
          currentCounter + 1 < MAX_UNLOCK_PASSWORDS_TRIES
        ) {
          state.wrongPasswordCounter[LOCKED_VAULT_PASS_ID] = currentCounter + 1;
        }
      }
    });

    builder.addCase(initVault.fulfilled, (state) => {
      state.initializeStatus = "exists";
    });

    builder.addCase(checkInitializeStatus.fulfilled, (state, action) => {
      state.initializeStatus = action.payload;
    });

    builder.addCase(
      restoreDateUntilVaultIsLocked.fulfilled,
      (state, action) => {
        if (action.payload) {
          state.dateUntilVaultIsLocked = action.payload;
        }
      }
    );
  },
});

export const { lockVault } = vaultSlice.actions;

export default vaultSlice.reducer;
