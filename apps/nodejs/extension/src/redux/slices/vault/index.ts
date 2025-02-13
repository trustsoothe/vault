import type {
  SerializedAccountReference,
  SerializedSession,
  SerializedRecoveryPhraseReference,
} from "@soothe/vault";
import type { RootState } from "../../store";
import { v4 } from "uuid";
import browser from "webextension-polyfill";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { Passphrase, VaultRestoreErrorName } from "@soothe/vault";
import { WebEncryptionService } from "@soothe/vault-encryption-web";
import { AssetStorage, getVault, NetworkStorage } from "../../../utils";
import { addSessionThunksToBuilder } from "./session";
import { addAccountThunksToBuilder } from "./account";
import { addBackupThunksToBuilder } from "./backup";
import { addPhraseThunksToBuilder } from "./phrases";

const webEncryptionService = new WebEncryptionService();
const ExtensionVaultInstance = getVault();

type InitializeStatus = "loading" | "exists" | "none";

const LOCKED_VAULT_PASS_ID = "LOCKED_VAULT_PASS";
const MAX_UNLOCK_PASSWORDS_TRIES = 6;

export interface VaultSlice {
  initializeStatus?: InitializeStatus;
  isUnlockedStatus: "no" | "yes" | "unlocking" | "locked_due_wrong_password";
  vaultSession: SerializedSession | null;
  wrongPasswordCounter: Record<string, number>;
  accounts: SerializedAccountReference[];
  sessions: SerializedSession[];
  recoveryPhrases: Array<SerializedRecoveryPhraseReference>;
  dateUntilVaultIsLocked?: number;
  backupData: {
    lastDate: number;
    vaultHash: string;
  } | null;
  dateWhenInitialized: number | null;
}

export const VAULT_HAS_BEEN_INITIALIZED_KEY = "vault_has_been_initialized";
export const DATE_WHEN_VAULT_INITIALIZED_KEY = "DATE_WHEN_VAULT_INITIALIZED";
export const PASSPHRASE = v4();

export const getVaultPassword = async (key: string) => {
  const passwordEncrypted = await browser.storage.session
    .get(key)
    .then((res) => res[key] || "");

  return await webEncryptionService.decrypt(
    new Passphrase(PASSPHRASE),
    passwordEncrypted
  );
};

export const initVault = createAsyncThunk<number, string>(
  "vault/initVault",
  async (password, { dispatch }) => {
    const dateWhenInitialized = Date.now();

    await ExtensionVaultInstance.initializeVault(password).then(() => {
      return browser.storage.local.set({
        [VAULT_HAS_BEEN_INITIALIZED_KEY]: "true",
        [DATE_WHEN_VAULT_INITIALIZED_KEY]: dateWhenInitialized,
      });
    });
    await dispatch(unlockVault(password)).unwrap();

    return dateWhenInitialized;
  }
);

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
  async (password: string, context) => {
    const state = context.getState() as RootState;
    const dateUntilVaultIsLocked = state.vault.dateUntilVaultIsLocked;
    const sessionsMaxAge = state.app.sessionsMaxAge;
    if (
      dateUntilVaultIsLocked &&
      dateUntilVaultIsLocked > new Date().getTime()
    ) {
      throw VaultCannotBeUnlockedError;
    }

    const session = await ExtensionVaultInstance.unlockVault(password, {
      sessionMaxAge: sessionsMaxAge.enabled
        ? sessionsMaxAge.maxAgeInSecs || 3600
        : 0,
    });

    const passwordEncrypted: string = await webEncryptionService.encrypt(
      new Passphrase(PASSPHRASE),
      password
    );

    const [sessions, networks, assets, accounts, phrases] = await Promise.all([
      ExtensionVaultInstance.listSessions(session.id),
      NetworkStorage.list(),
      AssetStorage.list(),
      ExtensionVaultInstance.listAccounts(session.id),
      ExtensionVaultInstance.listRecoveryPhrases(session.id),
      browser.storage.session.set({
        [session.id]: passwordEncrypted,
      }),
    ]);

    const accountsSerialized = accounts.map((item) => item.serialize());

    return {
      session: session.serialize(),
      entities: {
        sessions: sessions
          .filter((item) => item.isValid())
          .map((item) => item.serialize()),
        networks: networks.concat(),
        assets: assets.concat(),
        accounts: accountsSerialized,
        phrases: phrases.map((item) => item.serialize()),
      },
    };
  }
);

interface CheckInitializeStatusReturn {
  initializedStatus: InitializeStatus;
  dateWhenInitialized: number | null;
}

// todo: move to app
export const checkInitializeStatus =
  createAsyncThunk<CheckInitializeStatusReturn>(
    "vault/checkInitializeStatus",
    async () => {
      return browser.storage.local
        .get([VAULT_HAS_BEEN_INITIALIZED_KEY, DATE_WHEN_VAULT_INITIALIZED_KEY])
        .then((result) => {
          return {
            initializedStatus:
              result[VAULT_HAS_BEEN_INITIALIZED_KEY] === "true"
                ? "exists"
                : "none",
            dateWhenInitialized:
              result[DATE_WHEN_VAULT_INITIALIZED_KEY] || null,
          };
        });
    }
  );

const initialState: VaultSlice = {
  vaultSession: null,
  initializeStatus: "loading",
  isUnlockedStatus: "no",
  wrongPasswordCounter: {},
  accounts: [],
  sessions: [],
  recoveryPhrases: [],
  backupData: null,
  dateWhenInitialized: null,
};

const vaultSlice = createSlice({
  name: "vault",
  initialState,
  reducers: {
    lockVault: (state) => {
      ExtensionVaultInstance.lockVault();
      state.vaultSession = null;
      state.isUnlockedStatus = "no";
      state.wrongPasswordCounter = {};
      state.accounts = [];
      state.sessions = [];
      state.recoveryPhrases = [];
    },
  },
  extraReducers: (builder) => {
    addAccountThunksToBuilder(builder);
    addSessionThunksToBuilder(builder);
    addBackupThunksToBuilder(builder);
    addPhraseThunksToBuilder(builder);

    builder.addCase(unlockVault.fulfilled, (state, action) => {
      const {
        session,
        entities: { sessions, accounts, phrases },
      } = action.payload;
      state.vaultSession = session;
      state.isUnlockedStatus = "yes";

      state.sessions = sessions;
      state.accounts = accounts;
      state.recoveryPhrases = phrases;

      state.wrongPasswordCounter[LOCKED_VAULT_PASS_ID] = 0;
      state.dateUntilVaultIsLocked = undefined;
    });
    builder.addCase(unlockVault.rejected, (state, action) => {
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

    builder.addCase(initVault.fulfilled, (state, action) => {
      state.initializeStatus = "exists";
      state.dateWhenInitialized = action.payload;
    });

    builder.addCase(checkInitializeStatus.fulfilled, (state, action) => {
      state.initializeStatus = action.payload.initializedStatus;
      state.dateWhenInitialized = action.payload.dateWhenInitialized;
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
