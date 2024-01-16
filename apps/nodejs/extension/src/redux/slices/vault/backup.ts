import type { VaultSliceBuilder } from "../../../types";
import { z } from "zod";
import browser from "webextension-polyfill";
import { createAsyncThunk } from "@reduxjs/toolkit";
import { SupportedProtocols } from "@poktscan/keyring";
import {
  isNetworkUrlHealthy,
  isValidAddress,
} from "../../../utils/networkOperations";
import { RootState } from "../../store";
import { importAppSettings } from "../app";
import {
  DATE_WHEN_VAULT_INITIALIZED_KEY,
  unlockVault,
  VAULT_HAS_BEEN_INITIALIZED_KEY,
} from "./index";

const BACKUP_VAULT_KEY = "BACKUP_VAULT";

const SupportedProtocolsSchema = z.nativeEnum(SupportedProtocols);

const AccountReferenceSchema = z
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
/*  .refine(async (customRpc) => {
    try {
      const healthResult = await isNetworkUrlHealthy({
        rpcUrl: customRpc.url,
        protocol: customRpc.protocol,
        chainID: customRpc.chainId,
      });

      return (
        healthResult.canProvideBalance &&
        healthResult.canProvideFee &&
        healthResult.canSendTransaction
      );
    } catch (e) {
      return false;
    }
  }, "RPC is not valid");*/

const validVersions = ["0.0.1"] as const;

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
  contacts: AccountReferenceSchema.array(),
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
  async (encryptionPassword: string, context) => {
    const currentAppState = (context.getState() as RootState).app;

    const vault = await browser.storage.local
      .get("vault")
      .then((res) => res["vault"] || "");

    const vaultToExport: VaultBackupSchema = {
      vault,
      version: "0.0.1",
      settings: {
        contacts: currentAppState.contacts,
        customRpcs: currentAppState.customRpcs,
        selectedProtocol: currentAppState.selectedProtocol,
        assetsIdByAccount: currentAppState.assetsIdByAccount,
        networksCanBeSelected: currentAppState.networksCanBeSelected,
        selectedChainByProtocol: currentAppState.selectedChainByProtocol,
        selectedAccountByProtocol: currentAppState.selectedAccountByProtocol,
      },
    };

    const vaultHash = await hashString(JSON.stringify(vault));
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

      await browser.storage.local.set({
        vault: vault.vault,
        [VAULT_HAS_BEEN_INITIALIZED_KEY]: "true",
        [DATE_WHEN_VAULT_INITIALIZED_KEY]: dateWhenInitialized,
      });
      await context.dispatch(importAppSettings(vault.settings)).unwrap();
      await context
        .dispatch(unlockVault({ password, remember: true }))
        .unwrap();

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
