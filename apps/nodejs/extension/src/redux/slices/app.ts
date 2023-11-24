import type { ChainID } from "@poktscan/keyring/dist/lib/core/common/protocols/ChainID";
import type {
  ExternalConnectionRequest,
  ExternalNewAccountRequest,
  ExternalTransferRequest,
} from "../../types/communication";
import type { RootState } from "../store";
import browser from "webextension-polyfill";
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { SupportedProtocols } from "@poktscan/keyring";
import { SELECTED_CHAIN_CHANGED } from "../../constants/communication";
import {
  addNetworksExtraReducers,
  setGetAccountPending as setGetAccountPendingFromNetwork,
} from "./app/network";

export type RequestsType = (
  | ExternalConnectionRequest
  | ExternalNewAccountRequest
  | ExternalTransferRequest
) & { requestedAt?: number };

export interface AccountBalanceInfo {
  amount: number;
  lastUpdatedAt: number;
  error?: boolean;
  loading?: boolean;
}

interface IAccountBalances {
  [SupportedProtocols.Ethereum]: Record<
    ChainID<SupportedProtocols.Ethereum>,
    Record<string, AccountBalanceInfo | Record<string, AccountBalanceInfo>>
  >;
  [SupportedProtocols.Pocket]: Record<
    ChainID<SupportedProtocols.Pocket>,
    Record<string, AccountBalanceInfo>
  >;
}

export type ErrorsByNetwork = Record<string, number>;

export interface ErrorsPreferredNetwork {
  [SupportedProtocols.Pocket]: Record<
    ChainID<SupportedProtocols.Pocket>,
    ErrorsByNetwork
  >;
  [SupportedProtocols.Ethereum]: Record<
    ChainID<SupportedProtocols.Ethereum>,
    ErrorsByNetwork
  >;
}

export interface Network {
  id: string;
  label: string;
  protocol: SupportedProtocols;
  chainId: string;
  chainIdLabel: string;
  currencySymbol: string;
  coinGeckoId: string;
  decimals: number;
  isTestnet: boolean;
  isDefault: boolean;
  iconUrl: string;
  rpcUrl: string;
  explorerAccountUrl: string;
  explorerAccountWithAssetUrl?: string;
  explorerTransactionUrl: string;
  transferMinValue: string;
  assetPlatformId?: string;
}

export interface IAsset {
  id: string;
  label?: string;
  symbol: string;
  protocol: SupportedProtocols;
  chainId: string;
  contractAddress: string;
  decimals: 6;
  iconUrl: string;
  /**only presented in wPOKT assets at the moment*/
  vaultAddress?: string;
}

export interface NetworkCanBeSelectedMap {
  [SupportedProtocols.Pocket]: string[];
  [SupportedProtocols.Ethereum]: string[];
}

export interface GeneralAppSlice {
  requestsWindowId: number | null;
  externalRequests: RequestsType[];
  blockedSites: {
    loaded: boolean;
    list: string[];
  };
  showTestNetworks: boolean;
  selectedNetwork: SupportedProtocols;
  selectedChainByNetwork: Partial<Record<SupportedProtocols, string>>;
  selectedAccountByNetwork: Partial<Record<SupportedProtocols, string>>;
  accountBalances: IAccountBalances;
  networks: Network[];
  assets: IAsset[];
  errorsPreferredNetwork: ErrorsPreferredNetwork;
  activeTab?: {
    id?: number;
    url: string;
    favIconUrl?: string;
  };
  networksCanBeSelected: NetworkCanBeSelectedMap;
  assetsIdByAccountId: Record<string, string[]>;
}

const SELECTED_NETWORK_KEY = "SELECTED_NETWORK_KEY";
const SELECTED_ACCOUNTS_KEY = "SELECTED_ACCOUNTS_KEY";
const SELECTED_CHAINS_KEY = "SELECTED_CHAINS_KEY";
const SHOW_TEST_NETWORKS_KEY = "SHOW_TEST_NETWORKS";
const NETWORKS_CAN_BE_SELECTED_KEY = "NETWORKS_CAN_BE_SELECTED";
const ASSETS_SELECTED_BY_ACCOUNTS_KEY = "ASSETS_SELECTED_BY_ACCOUNTS";

export const loadSelectedNetworkAndAccount = createAsyncThunk(
  "app/loadSelectedNetworkAndAccount",
  async (_: never, context) => {
    const networks = (context.getState() as RootState).app.networks;

    const response = await browser.storage.local.get([
      SELECTED_NETWORK_KEY,
      SELECTED_ACCOUNTS_KEY,
      SELECTED_CHAINS_KEY,
      SHOW_TEST_NETWORKS_KEY,
      NETWORKS_CAN_BE_SELECTED_KEY,
      ASSETS_SELECTED_BY_ACCOUNTS_KEY,
    ]);

    const selectedNetwork =
      response[SELECTED_NETWORK_KEY] || SupportedProtocols.Pocket;
    const selectedAccountByNetwork = {
      ...(response[SELECTED_ACCOUNTS_KEY] || {}),
    };
    const assetsIdByAccountId = response[ASSETS_SELECTED_BY_ACCOUNTS_KEY] || {};
    const showTestNetworks = response[SHOW_TEST_NETWORKS_KEY] || false;
    const networksCanBeSelected =
      response[NETWORKS_CAN_BE_SELECTED_KEY] ||
      initialState.networksCanBeSelected;

    const selectedChainByNetwork = {
      [SupportedProtocols.Pocket]: "mainnet",
      [SupportedProtocols.Ethereum]: "1",
    };
    const savedSelectedChain = response[SELECTED_CHAINS_KEY] || {};

    for (const protocol in savedSelectedChain) {
      const chainId = savedSelectedChain[protocol];
      const networkExists = networks.some(
        (item) => item.protocol === protocol && item.chainId === chainId
      );

      if (networkExists) {
        selectedChainByNetwork[protocol] = chainId;
      }
    }

    return {
      selectedNetwork,
      selectedChainByNetwork,
      selectedAccountByNetwork,
      showTestNetworks,
      networksCanBeSelected,
      assetsIdByAccountId,
    };
  }
);

export const changeSelectedNetwork = createAsyncThunk(
  "app/changeSelectedNetwork",
  async (
    { network, chainId }: { network: SupportedProtocols; chainId: string },
    context
  ) => {
    const state = context.getState() as RootState;
    const {
      selectedChainByNetwork,
      selectedNetwork,
      selectedAccountByNetwork,
    } = state.app;

    const newSelectedAccountByNetwork = selectedAccountByNetwork;

    if (network !== selectedNetwork) {
      if (!selectedAccountByNetwork[network]) {
        const accounts = state.vault.entities.accounts.list;
        const accountOfNetwork = accounts.find(
          (item) => item.protocol === selectedNetwork
        );

        if (accountOfNetwork) {
          newSelectedAccountByNetwork[selectedNetwork] = accountOfNetwork.id;
        }
      }
    }

    const newSelectedChainByNetwork = {
      ...selectedChainByNetwork,
      [network]: chainId,
    };

    const promises: Promise<any>[] = [
      browser.storage.local.set({
        [SELECTED_NETWORK_KEY]: network,
        [SELECTED_CHAINS_KEY]: newSelectedChainByNetwork,
        [SELECTED_ACCOUNTS_KEY]: newSelectedAccountByNetwork,
      }),
    ];

    if (selectedChainByNetwork[network] !== chainId) {
      const message = {
        type: SELECTED_CHAIN_CHANGED,
        network,
        data: {
          chainId,
        },
      };

      promises.push(browser.runtime.sendMessage(message));
    }

    await Promise.all(promises);

    return {
      selectedNetwork: network,
      selectedChainByNetwork: newSelectedChainByNetwork,
      selectedAccountByNetwork: newSelectedAccountByNetwork,
    };
  }
);

export const toggleShowTestNetworks = createAsyncThunk(
  "app/toggleShowTestNetworks",
  async (_, context) => {
    const currentValue = (context.getState() as RootState).app.showTestNetworks;
    const newValue = !currentValue;
    await browser.storage.local.set({
      [SHOW_TEST_NETWORKS_KEY]: newValue,
    });

    return newValue;
  }
);

export const toggleNetworkCanBeSelected = createAsyncThunk<
  NetworkCanBeSelectedMap,
  { protocol: SupportedProtocols; chainId: string }
>("app/toggleNetworkCanBeSelected", async ({ protocol, chainId }, context) => {
  const networksCanBeSelected = (context.getState() as RootState).app
    .networksCanBeSelected;

  const canBeSelected = networksCanBeSelected[protocol].includes(chainId);

  if (canBeSelected) {
    networksCanBeSelected[protocol] = networksCanBeSelected[protocol].filter(
      (item) => item !== chainId
    );
  } else {
    networksCanBeSelected[protocol] = [
      ...networksCanBeSelected[protocol],
      chainId,
    ];
  }

  await browser.storage.local.set({
    [NETWORKS_CAN_BE_SELECTED_KEY]: networksCanBeSelected,
  });

  return networksCanBeSelected;
});

export const toggleAssetOfAccount = createAsyncThunk<
  Record<string, string[]>,
  { accountId: string; assetId: string }
>("app/toggleAssetOfAccount", async ({ accountId, assetId }, context) => {
  const assetsIdByAccountId = (context.getState() as RootState).app
    .assetsIdByAccountId;

  const assetInAccount = assetsIdByAccountId[accountId]?.includes(assetId);

  if (assetInAccount) {
    assetsIdByAccountId[accountId] = assetsIdByAccountId[accountId].filter(
      (asset) => assetId !== asset
    );
  } else {
    assetsIdByAccountId[accountId] = [
      ...(assetsIdByAccountId[accountId] || []),
      assetId,
    ];
  }

  await browser.storage.local.set({
    [ASSETS_SELECTED_BY_ACCOUNTS_KEY]: assetsIdByAccountId,
  });

  return assetsIdByAccountId;
});

export const changeSelectedAccountOfNetwork = createAsyncThunk(
  "app/changeSelectedAccountOfNetwork",
  async (
    {
      network,
      accountId,
    }: {
      network: SupportedProtocols;
      accountId: string;
    },
    context
  ) => {
    const state = context.getState() as RootState;
    const { selectedAccountByNetwork } = state.app;

    const newSelectedAccount = {
      ...selectedAccountByNetwork,
      [network]: accountId,
    };

    await browser.storage.local.set({
      [SELECTED_ACCOUNTS_KEY]: newSelectedAccount,
    });

    return newSelectedAccount;
  }
);

const BLOCKED_SITES_KEY = "BLOCKED_SITES";

export const getBlockedSites = createAsyncThunk<string[]>(
  "app/getBlockedSites",
  async (_, context) => {
    const { loaded, list } = (context.getState() as RootState).app.blockedSites;
    if (loaded) {
      return list;
    }

    const result = await browser.storage.local.get({ [BLOCKED_SITES_KEY]: [] });

    return result[BLOCKED_SITES_KEY] || [];
  }
);

export const unblockAllWebsites = createAsyncThunk(
  "app/unblockAllWebsites",
  async () => {
    await browser.storage.local.set({ [BLOCKED_SITES_KEY]: [] });
  }
);

export const toggleBlockWebsite = createAsyncThunk<string[], string>(
  "app/toggleBlockWebsite",
  async (website, context) => {
    const { loaded, list } = (context.getState() as RootState).app.blockedSites;

    let blockedSites: string[];

    if (loaded) {
      blockedSites = list;
    } else {
      const result = await browser.storage.local.get({
        [BLOCKED_SITES_KEY]: [],
      });

      blockedSites = result[BLOCKED_SITES_KEY] || [];
    }

    if (blockedSites.includes(website)) {
      blockedSites = blockedSites.filter((item) => item !== website);
    } else {
      blockedSites.push(website);
    }

    await browser.storage.local.set({ [BLOCKED_SITES_KEY]: blockedSites });

    return blockedSites;
  }
);

const initialState: GeneralAppSlice = {
  requestsWindowId: null,
  showTestNetworks: false,
  externalRequests: [],
  blockedSites: {
    loaded: false,
    list: [],
  },
  networks: [],
  assets: [],
  selectedAccountByNetwork: {
    [SupportedProtocols.Pocket]: "",
  },
  selectedChainByNetwork: {
    [SupportedProtocols.Pocket]: "mainnet",
  },
  selectedNetwork: SupportedProtocols.Pocket,
  accountBalances: {
    [SupportedProtocols.Pocket]: {
      mainnet: {},
      testnet: {},
    },
    [SupportedProtocols.Ethereum]: {
      "1": {},
      "5": {},
      "11155111": {},
    },
  },
  errorsPreferredNetwork: {
    [SupportedProtocols.Pocket]: {
      mainnet: {},
      testnet: {},
    },
    [SupportedProtocols.Ethereum]: {
      "1": {},
      "5": {},
      "11155111": {},
    },
  },
  networksCanBeSelected: {
    [SupportedProtocols.Ethereum]: [],
    [SupportedProtocols.Pocket]: [],
  },
  assetsIdByAccountId: {},
};

const generalAppSlice = createSlice({
  name: "app",
  initialState,
  reducers: {
    resetRequestsState: (state) => {
      state.externalRequests = [];
      state.requestsWindowId = null;
    },
    addExternalRequest: (state, action: PayloadAction<RequestsType>) => {
      state.externalRequests.push({
        ...action.payload,
        requestedAt: new Date().getTime(),
      });
    },
    addWindow: (state, action: PayloadAction<number>) => {
      state.requestsWindowId = action.payload;
    },
    removeExternalRequest: (
      state,
      action: PayloadAction<{ origin: string; type: string }>
    ) => {
      const { origin, type } = action.payload;

      state.externalRequests = state.externalRequests.filter(
        (request) => !(request.origin === origin && request.type === type)
      );
    },
    changeActiveTab: (
      state,
      action: PayloadAction<Required<GeneralAppSlice["activeTab"]>>
    ) => {
      state.activeTab = action.payload;
    },
    // this is here to only set that an account is loading after verifying it in the thunk
    setGetAccountPending: setGetAccountPendingFromNetwork,
  },
  extraReducers: (builder) => {
    addNetworksExtraReducers(builder);

    builder.addCase(getBlockedSites.fulfilled, (state, action) => {
      state.blockedSites.list = action.payload;
      state.blockedSites.loaded = true;
    });
    builder.addCase(toggleBlockWebsite.fulfilled, (state, action) => {
      state.blockedSites.list = action.payload;
      state.blockedSites.loaded = true;
    });
    builder.addCase(unblockAllWebsites.fulfilled, (state) => {
      state.blockedSites = {
        ...state.blockedSites,
        list: [],
      };
    });
    builder.addCase(
      loadSelectedNetworkAndAccount.fulfilled,
      (state, action) => {
        const {
          selectedNetwork,
          selectedChainByNetwork,
          selectedAccountByNetwork,
          showTestNetworks,
          networksCanBeSelected,
          assetsIdByAccountId,
        } = action.payload;

        state.selectedNetwork = selectedNetwork;
        state.selectedChainByNetwork = selectedChainByNetwork;
        state.selectedAccountByNetwork = selectedAccountByNetwork;
        state.showTestNetworks = showTestNetworks;
        state.networksCanBeSelected = networksCanBeSelected;
        state.assetsIdByAccountId = assetsIdByAccountId;
      }
    );
    builder.addCase(changeSelectedNetwork.fulfilled, (state, action) => {
      const {
        selectedNetwork,
        selectedChainByNetwork,
        selectedAccountByNetwork,
      } = action.payload;

      state.selectedNetwork = selectedNetwork;
      state.selectedChainByNetwork = selectedChainByNetwork;
      state.selectedAccountByNetwork = selectedAccountByNetwork;
    });
    builder.addCase(
      changeSelectedAccountOfNetwork.fulfilled,
      (state, action) => {
        state.selectedAccountByNetwork = action.payload;
      }
    );

    builder.addCase(toggleShowTestNetworks.fulfilled, (state, action) => {
      state.showTestNetworks = action.payload;
    });

    builder.addCase(toggleNetworkCanBeSelected.fulfilled, (state, action) => {
      state.networksCanBeSelected = action.payload;
    });

    builder.addCase(toggleAssetOfAccount.fulfilled, (state, action) => {
      state.assetsIdByAccountId = action.payload;
    });
  },
});

export const {
  resetRequestsState,
  removeExternalRequest,
  addExternalRequest,
  addWindow,
  setGetAccountPending,
  changeActiveTab,
} = generalAppSlice.actions;

export default generalAppSlice.reducer;
