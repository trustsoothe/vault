import type { ChainID } from "@poktscan/keyring/dist/lib/core/common/protocols/ChainID";
import type { RootState } from "../../store";
import {
  ActionReducerMapBuilder,
  createAsyncThunk,
  PayloadAction,
} from "@reduxjs/toolkit";
import { SupportedProtocols } from "@poktscan/keyring";
import {
  type GeneralAppSlice,
  setGetAccountPending as setGetAccountPendingFromApp,
} from "../app";
import { wait } from "../../../utils";
import { getAccountBalance as getBalance } from "../../../utils/networkOperations";

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
    // todo: change vault with app
    const networks = state.vault.entities.networks.list;
    // todo: change vault with app
    const assets = state.vault.entities.assets.list;
    const errorsPreferredNetwork = state.vault.errorsPreferredNetwork;
    const value = accountBalancesMap[address];

    if (
      value &&
      !value.error &&
      value.lastUpdatedAt > new Date().getTime() - 1200000
    ) {
      return {
        address,
        amount: value.amount,
        networksWithErrors: [],
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
      ? state.accountBalances.pocket[chainId]
      : token
      ? state.accountBalances.ethereum[chainId][token]
      : state.accountBalances.ethereum[chainId];

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
    const result = action.payload;
    const { address, protocol, chainId, token } = action.meta.arg;
    const { amount, networksWithErrors } = result;

    const balanceMap =
      protocol === SupportedProtocols.Pocket
        ? state.accountBalances.pocket[chainId]
        : token
        ? state.accountBalances.ethereum[chainId][token]
        : state.accountBalances.ethereum[chainId];

    balanceMap[address] = {
      lastUpdatedAt: new Date().getTime(),
      amount,
      error: false,
      loading: false,
    };

    console.log(JSON.stringify(balanceMap, null, 2));

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
    const { address, protocol, chainId, token } = action.meta.arg;

    const balanceMap =
      protocol === SupportedProtocols.Pocket
        ? state.accountBalances.pocket[chainId]
        : token
        ? state.accountBalances.ethereum[chainId][token]
        : state.accountBalances.ethereum[chainId];

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

export const addNetworksExtraReducers = (builder: Builder) => {
  addAccountBalanceToBuilder(builder);
};
