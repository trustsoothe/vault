import type { RootState } from "../../store";
import {
  ActionReducerMapBuilder,
  createAsyncThunk,
  PayloadAction,
} from "@reduxjs/toolkit";
import set from "lodash/set";
import get from "lodash/get";
import browser from "webextension-polyfill";
import { SupportedProtocols } from "@poktscan/keyring";
import {
  type GeneralAppSlice,
  setGetAccountPending as setGetAccountPendingFromApp,
} from "../app";
import { wait } from "../../../utils";
import { getAccountBalance as getBalance } from "../../../utils/networkOperations";

const NETWORKS_STORAGE_KEY = "networks";
const ASSETS_STORAGE_KEY = "assets";
const NETWORKS_CDN_URL =
  "https://poktscan-v1.nyc3.cdn.digitaloceanspaces.com/networks.json";
const ASSETS_CDN_URL =
  "https://poktscan-v1.nyc3.cdn.digitaloceanspaces.com/assets.json";

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
    const networks = state.app.networks.map((item) => ({
      ...item,
      chainID: item.chainId,
    }));
    const errorsPreferredNetwork = state.app.errorsPreferredNetwork;
    const value = get(state, path);

    if (
      value &&
      !value.error &&
      value.lastUpdatedAt > new Date().getTime() - 120000
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
      networks,
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

type Builder = ActionReducerMapBuilder<GeneralAppSlice>;

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

const addAccountBalanceToBuilder = (builder: Builder) => {
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
      const { protocol, chainId } = action.meta.arg;

      for (const networkId of networksWithErrors) {
        const path = ["errorsPreferredNetwork", protocol, chainId, networkId];
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

const addLoadNetworksToBuilder = (builder: Builder) => {
  builder.addCase(loadNetworksFromStorage.fulfilled, (state, action) => {
    state.networks = action.payload;
  });

  builder.addCase(loadNetworksFromCdn.fulfilled, (state, action) => {
    state.networks = action.payload;
  });
};

const addLoadAssetsToBuilder = (builder: Builder) => {
  builder.addCase(loadAssetsFromStorage.fulfilled, (state, action) => {
    state.assets = action.payload;
  });

  builder.addCase(loadAssetsFromCdn.fulfilled, (state, action) => {
    state.assets = action.payload;
  });
};

export const addNetworksExtraReducers = (builder: Builder) => {
  addAccountBalanceToBuilder(builder);
  addLoadNetworksToBuilder(builder);
  addLoadAssetsToBuilder(builder);
};
