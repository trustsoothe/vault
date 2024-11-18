import type { AppSliceBuilder } from "../../../types";
import { createAsyncThunk } from "@reduxjs/toolkit";
import { v4 } from "uuid";
import browser from "webextension-polyfill";
import { SupportedProtocols } from "@poktscan/vault";
import { CUSTOM_RPCS_KEY, CustomRPC, resetErrorOfNetwork } from "./index";
import { RPC_ALREADY_EXISTS } from "../../../errors/rpc";

const NETWORKS_STORAGE_KEY = "networks";
const ASSETS_STORAGE_KEY = "assets";
const NETWORKS_CDN_URL = process.env.NETWORKS_CDN_URL;
const ASSETS_CDN_URL = process.env.ASSETS_CDN_URL;

export const loadNetworksFromStorage = createAsyncThunk(
  "app/loadNetworksFromStorage",
  async () => {
    const result = await browser.storage.local.get({
      [NETWORKS_STORAGE_KEY]: [],
    });

    return (result[NETWORKS_STORAGE_KEY] || []).filter((item) =>
      [SupportedProtocols.Ethereum, SupportedProtocols.Pocket].includes(
        item.protocol
      )
    );
  }
);

export const loadNetworksFromCdn = createAsyncThunk(
  "app/loadNetworksFromCdn",
  async () => {
    const result = await fetch(NETWORKS_CDN_URL).then((res) => res.json());

    const resultProcessed = result.filter((item) =>
      [SupportedProtocols.Ethereum, SupportedProtocols.Pocket, SupportedProtocols.PocketShannon].includes(
        item.protocol
      )
    );

    await browser.storage.local.set({
      [NETWORKS_STORAGE_KEY]: resultProcessed,
    });

    return resultProcessed;
  }
);

export const loadAssetsFromStorage = createAsyncThunk(
  "app/loadAssetsFromStorage",
  async () => {
    const result = await browser.storage.local.get({
      [ASSETS_STORAGE_KEY]: [],
    });

    return (result[ASSETS_STORAGE_KEY] || []).filter((item) =>
      [SupportedProtocols.Ethereum, SupportedProtocols.Pocket, SupportedProtocols.PocketShannon].includes(
        item.protocol
      )
    );
  }
);

export const loadAssetsFromCdn = createAsyncThunk(
  "app/loadAssetsFromCdn",
  async () => {
    const result = await fetch(ASSETS_CDN_URL).then((res) => res.json());

    const resultProcessed = result.filter((item) =>
      [SupportedProtocols.Ethereum, SupportedProtocols.Pocket, SupportedProtocols.PocketShannon].includes(
        item.protocol
      )
    );

    await browser.storage.local.set({
      [ASSETS_STORAGE_KEY]: resultProcessed,
    });

    return resultProcessed;
  }
);

interface SaveCustomRpcParam {
  rpc: Omit<CustomRPC, "id">;
  /** id of the RPC to replace */
  idToReplace?: string;
}

export const saveCustomRpc = createAsyncThunk(
  "app/saveCustomRpc",
  async ({ rpc, idToReplace }: SaveCustomRpcParam, context) => {
    const alreadySavedRpcsRes = await browser.storage.local.get(
      CUSTOM_RPCS_KEY
    );
    const alreadySavedRpcs: CustomRPC[] =
      alreadySavedRpcsRes[CUSTOM_RPCS_KEY] || [];

    const rpcAlreadyExists = alreadySavedRpcs.some(
      (item) =>
        rpc.url === item.url &&
        item.protocol === rpc.protocol &&
        item.chainId === rpc.chainId
    );

    if (rpcAlreadyExists && !idToReplace) {
      throw RPC_ALREADY_EXISTS;
    }

    const rpcToSave: CustomRPC = {
      id: idToReplace || v4(),
      ...rpc,
    };

    let resetErrors = false;

    const newRpcList = idToReplace
      ? alreadySavedRpcs.map((item) => {
          if (item.id === idToReplace) {
            if (item.url !== rpcToSave.url) {
              resetErrors = true;
            }
            return rpcToSave;
          }

          return item;
        })
      : [...alreadySavedRpcs, rpcToSave];

    if (resetErrors) {
      await context.dispatch(resetErrorOfNetwork(idToReplace));
    }

    await browser.storage.local.set({
      [CUSTOM_RPCS_KEY]: newRpcList,
    });

    return {
      rpcSaved: rpcToSave,
      newList: newRpcList,
    };
  }
);

export const removeCustomRpc = createAsyncThunk(
  "app/removeCustomRpc",
  async (idRpc: string) => {
    const alreadySavedRpcsRes = await browser.storage.local.get(
      CUSTOM_RPCS_KEY
    );
    const alreadySavedRpcs: CustomRPC[] =
      alreadySavedRpcsRes[CUSTOM_RPCS_KEY] || [];

    const newRpcList = alreadySavedRpcs.filter((item) => item.id !== idRpc);

    await browser.storage.local.set({
      [CUSTOM_RPCS_KEY]: newRpcList,
    });

    return newRpcList;
  }
);

const addLoadNetworksToBuilder = (builder: AppSliceBuilder) => {
  builder.addCase(loadNetworksFromStorage.fulfilled, (state, action) => {
    state.networks = action.payload;
  });

  builder.addCase(loadNetworksFromCdn.fulfilled, (state, action) => {
    state.networks = action.payload;
  });
};

const addLoadAssetsToBuilder = (builder: AppSliceBuilder) => {
  builder.addCase(loadAssetsFromStorage.fulfilled, (state, action) => {
    state.assets = action.payload;
  });

  builder.addCase(loadAssetsFromCdn.fulfilled, (state, action) => {
    state.assets = action.payload;
  });
};

export const addNetworksExtraReducers = (builder: AppSliceBuilder) => {
  addLoadNetworksToBuilder(builder);
  addLoadAssetsToBuilder(builder);

  builder.addCase(saveCustomRpc.fulfilled, (state, action) => {
    state.customRpcs = action.payload.newList;
  });

  builder.addCase(removeCustomRpc.fulfilled, (state, action) => {
    state.customRpcs = action.payload;
  });
};
