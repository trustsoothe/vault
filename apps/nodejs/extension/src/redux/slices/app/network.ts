import type { ChainID } from "@poktscan/keyring/dist/lib/core/common/protocols/ChainID";
import type { RootState } from "../../store";
import {
  ActionReducerMapBuilder,
  createAsyncThunk,
  PayloadAction,
} from "@reduxjs/toolkit";
import browser from "webextension-polyfill";
import { SupportedProtocols } from "@poktscan/keyring";
import {
  type GeneralAppSlice,
  setGetAccountPending as setGetAccountPendingFromApp,
} from "../app";
import { wait } from "../../../utils";
import { getAccountBalance as getBalance } from "../../../utils/networkOperations";

const NETWORKS_STORAGE_KEY = "networks";
const NETWORKS_URL =
  "https://poktscan-v1.nyc3.cdn.digitaloceanspaces.com/networks.json";

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
    const result = await fetch(NETWORKS_URL).then((res) => res.json());

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

interface GetAccountBalanceParam {
  address: string;
  protocol: SupportedProtocols;
  chainId: ChainID<SupportedProtocols>;
  token?: string;
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
  async ({ address, protocol, chainId }, { getState, dispatch }) => {
    while (true) {
      const state = getState() as RootState;
      const accountBalancesMap = state.app.accountBalances[protocol][chainId];
      const isLoading = accountBalancesMap[address]?.loading;

      if (isLoading) {
        await wait(50);
      } else {
        break;
      }
    }

    dispatch(setGetAccountPendingFromApp({ address, protocol, chainId }));

    const state = getState() as RootState;
    const accountBalancesMap = state.app.accountBalances[protocol][chainId];
    const networks = state.app.networks.map((item) => ({
      ...item,
      chainID: item.chainId,
    }));
    // todo: change vault with app
    const assets = state.vault.entities.assets.list;
    const errorsPreferredNetwork = state.app.errorsPreferredNetwork;
    const value = accountBalancesMap[address];

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
      assets,
      errorsPreferredNetwork,
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
  const { address, protocol, chainId, token } = action.payload;

  const balanceMap =
    protocol === SupportedProtocols.Pocket
      ? state.accountBalances[SupportedProtocols.Pocket][chainId]
      : token
      ? state.accountBalances[SupportedProtocols.Ethereum][chainId][token]
      : state.accountBalances[SupportedProtocols.Ethereum][chainId];

  if (balanceMap[address]) {
    balanceMap[address] = {
      ...balanceMap[address],
      error: false,
      loading: true,
    };
  } else {
    balanceMap[address] = {
      error: false,
      amount: 0,
      lastUpdatedAt: Date.UTC(1970, 0, 1),
      loading: true,
    };
  }
};

const addAccountBalanceToBuilder = (builder: Builder) => {
  builder.addCase(getAccountBalance.fulfilled, (state, action) => {
    const { amount, networksWithErrors, update } = action.payload;
    const { address, protocol, chainId, token } = action.meta.arg;

    const balanceMap =
      protocol === SupportedProtocols.Pocket
        ? state.accountBalances[SupportedProtocols.Pocket][chainId]
        : token
        ? state.accountBalances[SupportedProtocols.Ethereum][chainId][token]
        : state.accountBalances[SupportedProtocols.Ethereum][chainId];

    balanceMap[address] = {
      lastUpdatedAt: update
        ? new Date().getTime()
        : balanceMap[address].lastUpdatedAt,
      amount,
      error: false,
      loading: false,
    };

    if (networksWithErrors.length) {
      const { protocol, chainId } = action.meta.arg;

      for (const networkId of networksWithErrors) {
        if (state.errorsPreferredNetwork[protocol][chainId][networkId]) {
          state.errorsPreferredNetwork[protocol][chainId][networkId]++;
        } else {
          state.errorsPreferredNetwork[protocol][chainId][networkId] = 1;
        }
      }
    }
  });

  builder.addCase(getAccountBalance.rejected, (state, action) => {
    console.log("GET BALANCE ERR:", action.error);
    const { address, protocol, chainId, token } = action.meta.arg;

    const balanceMap =
      protocol === SupportedProtocols.Pocket
        ? state.accountBalances[SupportedProtocols.Pocket][chainId]
        : token
        ? state.accountBalances[SupportedProtocols.Ethereum][chainId][token]
        : state.accountBalances[SupportedProtocols.Ethereum][chainId];

    if (balanceMap[address]) {
      balanceMap[address] = {
        ...balanceMap[address],
        error: true,
        loading: false,
      };
    } else {
      balanceMap[address] = {
        error: true,
        amount: 0,
        lastUpdatedAt: Date.UTC(1970, 0, 1),
        loading: false,
      };
    }
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

export const addNetworksExtraReducers = (builder: Builder) => {
  addAccountBalanceToBuilder(builder);
  addLoadNetworksToBuilder(builder);
};
