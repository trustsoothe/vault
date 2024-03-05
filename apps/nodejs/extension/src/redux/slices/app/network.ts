import type { RootState } from "../../store";
import type { AppSliceBuilder } from "../../../types";
import { createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { v4 } from "uuid";
import set from "lodash/set";
import get from "lodash/get";
import browser from "webextension-polyfill";
import { SupportedProtocols } from "@soothe/vault";
import {
  CUSTOM_RPCS_KEY,
  CustomRPC,
  type GeneralAppSlice,
  resetErrorOfNetwork,
  setGetAccountPending as setGetAccountPendingFromApp,
} from "./index";
import { wait } from "../../../utils";
import {
  getAccountBalance as getBalance,
  NetworkForOperations,
} from "../../../utils/networkOperations";
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
      [SupportedProtocols.Ethereum, SupportedProtocols.Pocket].includes(
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
      [SupportedProtocols.Ethereum, SupportedProtocols.Pocket].includes(
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
      [SupportedProtocols.Ethereum, SupportedProtocols.Pocket].includes(
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

    return newRpcList;
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

export interface GetAccountBalanceParam {
  address: string;
  protocol: SupportedProtocols;
  chainId: string;
  asset?: { contractAddress: string; decimals: number };
}

interface GetAccountBalanceResult {
  address: string;
  amount: number;
  networksWithErrors: string[];
  update?: boolean;
}

export const getAccountBalance = createAsyncThunk<
  GetAccountBalanceResult,
  GetAccountBalanceParam
>(
  "vault/getAccountBalance",
  async ({ address, protocol, chainId, asset }, { getState, dispatch }) => {
    const path = ["app", "accountBalances", protocol, chainId];

    if (asset) {
      path.push(asset.contractAddress);
    }

    path.push(address);

    while (true) {
      const state = getState() as RootState;

      const isLoading = get(state, [...path, "loading"], false);

      if (isLoading) {
        await wait(50);
      } else {
        break;
      }
    }

    dispatch(
      setGetAccountPendingFromApp({ address, protocol, chainId, asset })
    );

    const state = getState() as RootState;
    const errorsPreferredNetwork = state.app.errorsPreferredNetwork;
    const value = get(state, path);

    const {
      app: { networks: defaultNetworks, customRpcs },
    } = state;

    const allNetworks = [
      ...defaultNetworks.map(
        (network) =>
          ({
            protocol: network.protocol,
            id: network.id,
            chainID: network.chainId,
            isDefault: true,
            isPreferred: false,
            rpcUrl: network.rpcUrl,
          } as NetworkForOperations)
      ),
      ...customRpcs.map(
        (rpc) =>
          ({
            protocol: rpc.protocol,
            id: rpc.id,
            chainID: rpc.chainId,
            isDefault: false,
            isPreferred: rpc.isPreferred,
            rpcUrl: rpc.url,
          } as NetworkForOperations)
      ),
    ];

    if (
      value &&
      !value.error &&
      value.lastUpdatedAt > new Date().getTime() - 30 * 1000
    ) {
      return {
        address,
        amount: value.amount,
        networksWithErrors: [],
        update: false,
      };
    }

    const result = await getBalance({
      address,
      protocol,
      chainId,
      networks: allNetworks,
      errorsPreferredNetwork,
      asset,
    });

    return {
      address,
      amount: result.balance,
      networksWithErrors: result.networksWithErrors,
      update: true,
    };
  }
);

export const setGetAccountPending = (
  state: GeneralAppSlice,
  action: PayloadAction<GetAccountBalanceParam>
) => {
  const { address, protocol, chainId, asset } = action.payload;

  const paths = ["accountBalances", protocol, chainId];

  if (asset && protocol === SupportedProtocols.Ethereum) {
    paths.push(asset.contractAddress);
  }

  paths.push(address);

  set(state, paths, {
    ...get(state, paths, {
      amount: 0,
      lastUpdatedAt: Date.UTC(1970, 0, 1),
    }),
    error: false,
    loading: true,
  });
};

const addAccountBalanceToBuilder = (builder: AppSliceBuilder) => {
  builder.addCase(getAccountBalance.fulfilled, (state, action) => {
    const { amount, networksWithErrors, update } = action.payload;
    const { address, protocol, chainId, asset } = action.meta.arg;

    const paths = ["accountBalances", protocol, chainId];

    if (asset && protocol === SupportedProtocols.Ethereum) {
      paths.push(asset.contractAddress);
    }

    paths.push(address);

    set(state, paths, {
      lastUpdatedAt: update
        ? new Date().getTime()
        : get(state, [...paths, "lastUpdatedAt"], Date.UTC(1970, 0, 1)),
      amount,
      error: false,
      loading: false,
    });

    if (networksWithErrors.length) {
      for (const networkId of networksWithErrors) {
        const path = ["errorsPreferredNetwork", networkId];
        set(state, path, get(state, path, 0) + 1);
      }
    }
  });

  builder.addCase(getAccountBalance.rejected, (state, action) => {
    console.log("GET BALANCE ERR:", action.error);
    const { address, protocol, chainId, asset } = action.meta.arg;

    const paths = ["accountBalances", protocol, chainId];

    if (asset && protocol === SupportedProtocols.Ethereum) {
      paths.push(asset.contractAddress);
    }

    paths.push(address);

    set(state, paths, {
      ...get(state, paths, {
        amount: 0,
        lastUpdatedAt: Date.UTC(1970, 0, 1),
      }),
      error: true,
      loading: false,
    });
  });
};

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
  addAccountBalanceToBuilder(builder);
  addLoadNetworksToBuilder(builder);
  addLoadAssetsToBuilder(builder);

  builder.addCase(saveCustomRpc.fulfilled, (state, action) => {
    state.customRpcs = action.payload;
  });

  builder.addCase(removeCustomRpc.fulfilled, (state, action) => {
    state.customRpcs = action.payload;
  });
};
