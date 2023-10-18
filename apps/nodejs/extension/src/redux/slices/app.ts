import type {
  ExternalConnectionRequest,
  ExternalNewAccountRequest,
  ExternalTransferRequest,
} from "../../types/communication";
import type { RootState } from "../store";
import browser from "webextension-polyfill";
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  SerializedAccountReference,
  SupportedProtocols,
} from "@poktscan/keyring";
import { SELECTED_CHAIN_CHANGED } from "../../constants/communication";

export type RequestsType = (
  | ExternalConnectionRequest
  | ExternalNewAccountRequest
  | ExternalTransferRequest
) & { requestedAt?: number };

interface GeneralAppSlice {
  requestsWindowId: number | null;
  externalRequests: RequestsType[];
  blockedSites: {
    loaded: boolean;
    list: string[];
  };
  selectedNetwork: SupportedProtocols;
  selectedChainByNetwork: Partial<Record<SupportedProtocols, string>>;
  selectedAccountByNetwork: Partial<Record<SupportedProtocols, string>>;
}

const SELECTED_NETWORK_KEY = "SELECTED_NETWORK_KEY";
const SELECTED_ACCOUNTS_KEY = "SELECTED_ACCOUNTS_KEY";
const SELECTED_CHAINS_KEY = "SELECTED_CHAINS_KEY";

// only to be called in unlockVault thunk
export const getSelectedNetworkAndAccount = createAsyncThunk(
  "app/getSelectedNetworkAndAccount",
  async (accounts: SerializedAccountReference[], context) => {
    const response = await browser.storage.local.get([
      SELECTED_NETWORK_KEY,
      SELECTED_ACCOUNTS_KEY,
      SELECTED_CHAINS_KEY,
    ]);

    const selectedNetwork =
      response[SELECTED_NETWORK_KEY] || SupportedProtocols.Pocket;
    const accountsByNetwork = {
      ...response[SELECTED_ACCOUNTS_KEY],
    };

    const lastAccountId = accountsByNetwork[selectedNetwork];
    const accountFromList = accounts.find(
      (account) => account.id === lastAccountId
    );

    if (!accountFromList) {
      const accountOfNetwork = accounts.find(
        (item) => item.asset.protocol === selectedNetwork
      );

      if (accountOfNetwork) {
        accountsByNetwork[selectedNetwork] = accountOfNetwork.id;
      }
    }

    return {
      selectedNetwork,
      selectedChainByNetwork: {
        [SupportedProtocols.Pocket]: "mainnet",
        ...response[SELECTED_CHAINS_KEY],
      },
      selectedAccountByNetwork: accountsByNetwork,
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
          (item) => item.asset.protocol === selectedNetwork
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
  externalRequests: [],
  blockedSites: {
    loaded: false,
    list: [],
  },
  selectedAccountByNetwork: {
    [SupportedProtocols.Pocket]: "",
  },
  selectedChainByNetwork: {
    [SupportedProtocols.Pocket]: "mainnet",
  },
  selectedNetwork: SupportedProtocols.Pocket,
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
  },
  extraReducers: (builder) => {
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
    builder.addCase(getSelectedNetworkAndAccount.fulfilled, (state, action) => {
      const {
        selectedNetwork,
        selectedChainByNetwork,
        selectedAccountByNetwork,
      } = action.payload;

      state.selectedNetwork = selectedNetwork;
      state.selectedChainByNetwork = selectedChainByNetwork;
      state.selectedAccountByNetwork = selectedAccountByNetwork;
    });
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
  },
});

export const {
  resetRequestsState,
  removeExternalRequest,
  addExternalRequest,
  addWindow,
} = generalAppSlice.actions;

export default generalAppSlice.reducer;
