import type { VaultSliceBuilder } from "../../../types";
import { z } from "zod";
import browser from "webextension-polyfill";
import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  EncryptedVault,
  SerializedEncryptedVault,
  SupportedProtocols,
} from "@poktscan/vault";
import { isValidAddress } from "../../../utils/networkOperations";
import { RootState } from "../../store";
import { importAppSettings } from "../app";
import {
  DATE_WHEN_VAULT_INITIALIZED_KEY,
  unlockVault,
  VAULT_HAS_BEEN_INITIALIZED_KEY,
} from "./index";
import { getVault } from "../../../utils";
import TransactionDatasource, {
  EthTransaction,
  PoktTransaction,
} from "../../../controllers/datasource/Transaction";

const BACKUP_VAULT_KEY = "BACKUP_VAULT";

const SupportedProtocolsSchema = z.nativeEnum(SupportedProtocols);

const ContactsSchema = z
  .object({
    id: z.string().uuid(),
    name: z.string(),
    address: z.string(),
    protocol: SupportedProtocolsSchema,
  })
  .refine(
    (value) => isValidAddress(value.address, value.protocol),
    "invalid address"
  );

const CustomRpcSchema = z.object({
  id: z.string().uuid(),
  url: z.string().url(),
  chainId: z.string(),
  protocol: SupportedProtocolsSchema,
  isPreferred: z.boolean().default(false),
});

const validVersions = ["0.0.3", "0.0.4", "0.0.5", "0.0.6", "0.1.2"] as const;

export const SettingsSchema = z.object({
  selectedProtocol: SupportedProtocolsSchema.default(SupportedProtocols.Pocket),
  selectedChainByProtocol: z
    .record(SupportedProtocolsSchema, z.string())
    .default({
      [SupportedProtocols.Pocket]: "mainnet",
      [SupportedProtocols.Ethereum]: "1",
    }),
  selectedAccountByProtocol: z
    .record(SupportedProtocolsSchema, z.string())
    .default({}),
  networksCanBeSelected: z.record(SupportedProtocolsSchema, z.string().array()),
  assetsIdByAccount: z.record(z.string(), z.string().array()),
  customRpcs: CustomRpcSchema.array(),
  contacts: ContactsSchema.array(),
  accountsImported: z.string().array().default([]),
  sessionsMaxAge: z
    .object({
      enabled: z.boolean().default(false),
      maxAgeInSecs: z.number().min(900).max(3.154e7).default(3600),
    })
    .default({
      enabled: false,
      maxAgeInSecs: 3600,
    }),
  requirePasswordForSensitiveOpts: z.boolean().default(false),
  txs: z
    .string()
    .optional()
    .refine((encodedTxs) => {
      if (encodedTxs) {
        try {
          const decodedTxs = JSON.parse(atob(encodedTxs));

          for (const decodedTx of decodedTxs) {
            switch (decodedTx.protocol) {
              case "Pocket":
                PoktTransaction.parse(decodedTx);
                break;
              case "Ethereum":
                EthTransaction.parse(decodedTx);
                break;
              default:
                throw new Error("Unsupported protocol");
            }
          }

          return true;
        } catch (e) {
          return false;
        }
      } else {
        return true;
      }
    }, "Invalid transactions"),
});

export type SettingsSchema = z.infer<typeof SettingsSchema>;

export const VaultBackupSchema = z.object({
  version: z.enum(validVersions),
  vault: z.object({
    contents: z.string(),
    createdAt: z.number(),
    updatedAt: z.number(),
  }),
  settings: SettingsSchema,
});

export type VaultBackupSchema = z.infer<typeof VaultBackupSchema>;

export const loadBackupData = createAsyncThunk(
  "vault/loadBackupData",
  async () => {
    return browser.storage.local
      .get(BACKUP_VAULT_KEY)
      .then((res) => res[BACKUP_VAULT_KEY] || null);
  }
);

export const hashString = async (message: string) => {
  const msgUint8 = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
};

export const exportVault = createAsyncThunk(
  "vault/exportVault",
  async (
    {
      encryptionPassword,
      vaultPassword,
    }: { encryptionPassword: string; vaultPassword?: string },
    context
  ) => {
    const state = context.getState() as RootState;
    const currentAppState = state.app;

    const vault = getVault();
    const encryptedVault = await vault
      .exportVault(vaultPassword, encryptionPassword || vaultPassword)
      .then((instance) => instance.serialize());

    const transactions = await TransactionDatasource.getTransactionsOfNetworks(
      state.app.networks
    );

    const transactionsEncoded = btoa(JSON.stringify(transactions));

    const vaultToExport: VaultBackupSchema = {
      vault: encryptedVault,
      version: "0.0.6",
      settings: {
        contacts: currentAppState.contacts,
        customRpcs: currentAppState.customRpcs,
        selectedProtocol: currentAppState.selectedProtocol,
        assetsIdByAccount: currentAppState.assetsIdByAccount,
        networksCanBeSelected: currentAppState.networksCanBeSelected,
        selectedChainByProtocol: currentAppState.selectedChainByProtocol,
        selectedAccountByProtocol: currentAppState.selectedAccountByProtocol,
        sessionsMaxAge: currentAppState.sessionsMaxAge,
        requirePasswordForSensitiveOpts:
          currentAppState.requirePasswordForSensitiveOpts,
        accountsImported: currentAppState.accountsImported,
        txs: transactionsEncoded,
      },
    };

    const vaultHash = await hashString(JSON.stringify(encryptedVault.contents));
    const backupData = {
      vaultHash,
      lastDate: Date.now(),
    };

    await browser.storage.local.set({ [BACKUP_VAULT_KEY]: backupData });

    return {
      exportedVault: vaultToExport,
      backupData,
    };
  }
);

interface ImportVaultArg {
  vault: VaultBackupSchema;
  password: string;
}

export const importVault = createAsyncThunk(
  "vault/importVault",
  async ({ vault, password }: ImportVaultArg, context) => {
    try {
      vault = VaultBackupSchema.parse(vault);
      const dateWhenInitialized = Date.now();

      const vaultTeller = getVault();

      await vaultTeller.importVault(
        EncryptedVault.deserialize(vault.vault as SerializedEncryptedVault),
        password
      );
      await browser.storage.local.set({
        [VAULT_HAS_BEEN_INITIALIZED_KEY]: "true",
        [DATE_WHEN_VAULT_INITIALIZED_KEY]: dateWhenInitialized,
      });
      await context.dispatch(importAppSettings(vault.settings)).unwrap();
      await context.dispatch(unlockVault(password)).unwrap();

      return dateWhenInitialized;
    } catch (e) {
      await browser.storage.local
        .set({
          vault: null,
          [VAULT_HAS_BEEN_INITIALIZED_KEY]: null,
          [DATE_WHEN_VAULT_INITIALIZED_KEY]: null,
        })
        .catch();

      throw e;
    }
  }
);

export const addBackupThunksToBuilder = (builder: VaultSliceBuilder) => {
  builder.addCase(loadBackupData.fulfilled, (state, action) => {
    state.backupData = action.payload;
  });

  builder.addCase(
    exportVault.fulfilled,
    (state, { payload: { backupData } }) => {
      state.backupData = backupData;
    }
  );

  builder.addCase(importVault.fulfilled, (state, action) => {
    state.initializeStatus = "exists";
    state.dateWhenInitialized = action.payload;
  });
};
