import type { AppRequests } from "../../../types/communications";
import type { AccountsChangedToProxy } from "../../../types/communications/accountChanged";
import type { RootState } from "../../store";
import set from "lodash/set";
import get from "lodash/get";
import browser from "webextension-polyfill";
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  SerializedAccountReference,
  Session,
  SupportedProtocols,
} from "@poktscan/keyring";
import {
  SELECTED_ACCOUNT_CHANGED,
  SELECTED_CHAIN_CHANGED,
} from "../../../constants/communication";
import {
  addNetworksExtraReducers,
  setGetAccountPending as setGetAccountPendingFromNetwork,
} from "./network";
import { SettingsSchema } from "../vault/backup";
import {addContactThunksToBuilder, Contact} from "./contact";
import { ChainChangedMessageToProxy } from "../../../types/communications/chainChanged";

export interface AccountBalanceInfo {
  amount: number;
  lastUpdatedAt: number;
  error?: boolean;
  loading?: boolean;
}

interface IAccountBalances {
  [SupportedProtocols.Ethereum]: Record<
    string,
    Record<string, AccountBalanceInfo | Record<string, AccountBalanceInfo>>
  >;
  [SupportedProtocols.Pocket]: Record<
    string,
    Record<string, AccountBalanceInfo>
  >;
}

export type ErrorsByNetwork = Record<string, number>;

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
  mintContractAddress?: string;
  decimals: 6;
  iconUrl: string;
  /**only presented in wPOKT assets at the moment*/
  vaultAddress?: string;
}

export interface CustomRPC {
  id: string;
  protocol: SupportedProtocols;
  chainId: string;
  url: string;
  isPreferred?: boolean;
}

export interface NetworkCanBeSelectedMap {
  [SupportedProtocols.Pocket]: string[];
  [SupportedProtocols.Ethereum]: string[];
}

export interface GeneralAppSlice {
  requestsWindowId: number | null;
  externalRequests: AppRequests[];
  blockedSites: {
    loaded: boolean;
    list: string[];
  };
  showTestNetworks: boolean;
  selectedProtocol: SupportedProtocols;
  selectedChainByProtocol: Partial<Record<SupportedProtocols, string>>;
  selectedAccountByProtocol: Partial<Record<SupportedProtocols, string>>;
  accountBalances: IAccountBalances;
  networks: Network[];
  assets: IAsset[];
  errorsPreferredNetwork: ErrorsByNetwork;
  activeTab?: {
    id?: number;
    url: string;
    favIconUrl?: string;
  };
  networksCanBeSelected: NetworkCanBeSelectedMap;
  assetsIdByAccount: Record<string, string[]>;
  customRpcs: CustomRPC[];
  contacts: Contact[];
  isReadyStatus: "yes" | "no" | "loading" | "error";
  idOfMintsSent: string[];
  sessionsMaxAge: {
    enabled: boolean;
    maxAgeInSecs: number;
  };
  requirePasswordForSensitiveOpts: boolean;
  accountsImported: string[];
}

const SELECTED_NETWORK_KEY = "SELECTED_NETWORK_KEY";
const SELECTED_ACCOUNTS_KEY = "SELECTED_ACCOUNTS_KEY";
const SELECTED_CHAINS_KEY = "SELECTED_CHAINS_KEY";
const SHOW_TEST_NETWORKS_KEY = "SHOW_TEST_NETWORKS";
const NETWORKS_CAN_BE_SELECTED_KEY = "NETWORKS_CAN_BE_SELECTED";
const ASSETS_SELECTED_BY_ACCOUNTS_KEY = "ASSETS_SELECTED_BY_ACCOUNTS";
const SESSION_MAX_AGE_KEY = "SESSION_MAX_AGE";
const REQUIRE_PASS_SENSITIVE_OPTS_KEY = "REQUIRE_PASS_SENSITIVE_OPTS";

export const CUSTOM_RPCS_KEY = "CUSTOM_RPCS";
export const CONTACTS_KEY = "CONTACTS";
export const ACCOUNTS_IMPORTED_KEY = "ACCOUNTS_IMPORTED";

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
      CUSTOM_RPCS_KEY,
      CONTACTS_KEY,
      SESSION_MAX_AGE_KEY,
      REQUIRE_PASS_SENSITIVE_OPTS_KEY,
      ACCOUNTS_IMPORTED_KEY,
    ]);

    const selectedProtocol =
      response[SELECTED_NETWORK_KEY] || SupportedProtocols.Pocket;
    const selectedAccountByProtocol = {
      ...(response[SELECTED_ACCOUNTS_KEY] || {}),
    };
    const assetsIdByAccount = response[ASSETS_SELECTED_BY_ACCOUNTS_KEY] || {};
    const showTestNetworks = response[SHOW_TEST_NETWORKS_KEY] || false;
    const networksCanBeSelected =
      response[NETWORKS_CAN_BE_SELECTED_KEY] ||
      initialState.networksCanBeSelected;
    const customRpcs = response[CUSTOM_RPCS_KEY] || [];
    const contacts = response[CONTACTS_KEY] || [];

    const selectedChainByProtocol = {
      [SupportedProtocols.Pocket]: "mainnet",
      [SupportedProtocols.Ethereum]: "1",
    };
    const savedSelectedChain = response[SELECTED_CHAINS_KEY] || {};
    const sessionMaxAge =
      response[SESSION_MAX_AGE_KEY] || initialState.sessionsMaxAge;
    const requirePasswordForSensitiveOpts =
      response[REQUIRE_PASS_SENSITIVE_OPTS_KEY] || false;
    const accountsImported = response[ACCOUNTS_IMPORTED_KEY] || [];

    for (const protocol in savedSelectedChain) {
      const chainId = savedSelectedChain[protocol];
      const networkExists = networks.some(
        (item) => item.protocol === protocol && item.chainId === chainId
      );

      if (networkExists) {
        selectedChainByProtocol[protocol] = chainId;
      }
    }

    return {
      selectedProtocol,
      selectedChainByProtocol,
      selectedAccountByProtocol,
      showTestNetworks,
      networksCanBeSelected,
      assetsIdByAccount,
      customRpcs,
      contacts,
      sessionMaxAge,
      requirePasswordForSensitiveOpts,
      accountsImported,
    };
  }
);

export const changeSelectedNetwork = createAsyncThunk(
  "app/changeSelectedNetwork",
  async (
    {
      network: protocol,
      chainId,
    }: { network: SupportedProtocols; chainId: string },
    context
  ) => {
    const state = context.getState() as RootState;
    const {
      selectedChainByProtocol,
      selectedProtocol,
      selectedAccountByProtocol,
    } = state.app;

    const newSelectedAccountByProtocol = selectedAccountByProtocol;

    if (protocol !== selectedProtocol) {
      if (!newSelectedAccountByProtocol[protocol]) {
        const accounts = state.vault.accounts;
        const accountOfNetwork = accounts.find(
          (item) => item.protocol === selectedProtocol
        );

        if (accountOfNetwork) {
          newSelectedAccountByProtocol[selectedProtocol] =
            accountOfNetwork.address;
        }
      }
    }

    const newSelectedChainByProtocol = {
      ...selectedChainByProtocol,
      [protocol]: chainId,
    };

    await browser.storage.local.set({
      [SELECTED_NETWORK_KEY]: protocol,
      [SELECTED_CHAINS_KEY]: newSelectedChainByProtocol,
      [SELECTED_ACCOUNTS_KEY]: newSelectedAccountByProtocol,
    });

    const promises: Promise<any>[] = [];

    if (selectedChainByProtocol[protocol] !== chainId) {
      const message: ChainChangedMessageToProxy = {
        type: SELECTED_CHAIN_CHANGED,
        protocol,
        data: {
          chainId:
            protocol === SupportedProtocols.Ethereum
              ? `0x${Number(chainId || "1").toString(16)}`
              : chainId,
        },
      };

      const allTabs = await browser.tabs.query({});
      for (const tab of allTabs) {
        promises.push(browser.tabs.sendMessage(tab.id, message));
      }
    }

    await Promise.allSettled(promises);

    return {
      selectedProtocol: protocol,
      selectedChainByProtocol: newSelectedChainByProtocol,
      selectedAccountByProtocol: newSelectedAccountByProtocol,
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
  { address: string; assetId: string }
>("app/toggleAssetOfAccount", async ({ address, assetId }, context) => {
  const assetsIdByAccount = (context.getState() as RootState).app
    .assetsIdByAccount;

  const assetInAccount = assetsIdByAccount[address]?.includes(assetId);

  if (assetInAccount) {
    assetsIdByAccount[address] = assetsIdByAccount[address].filter(
      (asset) => assetId !== asset
    );
  } else {
    assetsIdByAccount[address] = [
      ...(assetsIdByAccount[address] || []),
      assetId,
    ];
  }

  await browser.storage.local.set({
    [ASSETS_SELECTED_BY_ACCOUNTS_KEY]: assetsIdByAccount,
  });

  return assetsIdByAccount;
});

export const changeSelectedAccountOfNetwork = createAsyncThunk(
  "app/changeSelectedAccountOfNetwork",
  async (
    {
      protocol,
      address,
    }: {
      protocol: SupportedProtocols;
      address: string;
    },
    context
  ) => {
    const state = context.getState() as RootState;
    const { selectedAccountByProtocol } = state.app;

    const newSelectedAccount = {
      ...selectedAccountByProtocol,
      [protocol]: address,
    };

    await browser.storage.local.set({
      [SELECTED_ACCOUNTS_KEY]: newSelectedAccount,
    });

    const sessions = state.vault.sessions;

    const promises: Promise<any>[] = [];

    for (const session of sessions) {
      if (!!session.origin) {
        for (const permission of session.permissions) {
          if (
            permission.resource === "account" &&
            permission.action === "read" &&
            permission.identities.includes(address)
          ) {
            const sessionInstance = Session.deserialize(session);
            if (sessionInstance.isValid()) {
              const addresses = permission.identities;

              const newAccounts = [
                address,
                ...addresses.filter((item) => item !== address),
              ];

              const message: AccountsChangedToProxy = {
                type: SELECTED_ACCOUNT_CHANGED,
                protocol: session.protocol || protocol,
                data: {
                  addresses: newAccounts,
                },
              };

              try {
                const tabsWithOrigin = await browser.tabs.query({
                  url: `${session.origin}/*`,
                });
                for (const tab of tabsWithOrigin) {
                  promises.push(browser.tabs.sendMessage(tab.id, message));
                }
              } catch (e) {}
            }
          }
        }
      }
    }

    await Promise.allSettled(promises);

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

export const setSessionMaxAgeData = createAsyncThunk(
  "app/setSessionMaxAgeData",
  async (data: GeneralAppSlice["sessionsMaxAge"]) => {
    await browser.storage.local.set({ [SESSION_MAX_AGE_KEY]: data });

    return data;
  }
);

export const setRequirePasswordSensitiveOpts = createAsyncThunk(
  "app/setRequirePasswordSensitiveOpts",
  async (enabled: boolean) => {
    await browser.storage.local.set({
      [REQUIRE_PASS_SENSITIVE_OPTS_KEY]: enabled,
    });

    return enabled;
  }
);

export const addImportedAccountAddress = createAsyncThunk(
  "app/addImportedAccountAddress",
  async (address: string, context) => {
    const currentAccountsImported = (context.getState() as RootState).app
      .accountsImported;
    const newAccountsImported = [...currentAccountsImported, address];

    await browser.storage.local.set({
      [ACCOUNTS_IMPORTED_KEY]: newAccountsImported,
    });

    return newAccountsImported;
  }
);

export const removeImportedAccountAddress = createAsyncThunk(
  "app/removeImportedAccountAddress",
  async (address: string, context) => {
    const currentAccountsImported = (context.getState() as RootState).app
      .accountsImported;
    const newAccountsImported = currentAccountsImported.filter(
      (addressItem) => addressItem !== address
    );

    await browser.storage.local.set({
      [ACCOUNTS_IMPORTED_KEY]: newAccountsImported,
    });

    return newAccountsImported;
  }
);

export const importAppSettings = createAsyncThunk(
  "app/importSettings",
  async (settings: SettingsSchema) => {
    const settingsParsed = SettingsSchema.parse(settings);
    const {
      assetsIdByAccount,
      selectedAccountByProtocol,
      selectedChainByProtocol,
      selectedProtocol,
      networksCanBeSelected,
      customRpcs,
      contacts,
      sessionsMaxAge,
      requirePasswordForSensitiveOpts,
      accountsImported,
    } = settingsParsed;

    await browser.storage.local.set({
      [ASSETS_SELECTED_BY_ACCOUNTS_KEY]: assetsIdByAccount,
      [SELECTED_ACCOUNTS_KEY]: selectedAccountByProtocol,
      [SELECTED_CHAINS_KEY]: selectedChainByProtocol,
      [SELECTED_NETWORK_KEY]: selectedProtocol,
      [NETWORKS_CAN_BE_SELECTED_KEY]: networksCanBeSelected,
      [CUSTOM_RPCS_KEY]: customRpcs,
      [CONTACTS_KEY]: contacts,
      [SESSION_MAX_AGE_KEY]: sessionsMaxAge,
      [REQUIRE_PASS_SENSITIVE_OPTS_KEY]: requirePasswordForSensitiveOpts,
      [ACCOUNTS_IMPORTED_KEY]: accountsImported,
    });

    return settingsParsed;
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
  selectedAccountByProtocol: {
    [SupportedProtocols.Pocket]: "",
    [SupportedProtocols.Ethereum]: "",
  },
  selectedChainByProtocol: {
    [SupportedProtocols.Pocket]: "mainnet",
    [SupportedProtocols.Ethereum]: "1",
  },
  selectedProtocol: SupportedProtocols.Pocket,
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
  errorsPreferredNetwork: {},
  networksCanBeSelected: {
    [SupportedProtocols.Ethereum]: [],
    [SupportedProtocols.Pocket]: [],
  },
  assetsIdByAccount: {},
  customRpcs: [],
  contacts: [],
  isReadyStatus: "no",
  idOfMintsSent: [],
  sessionsMaxAge: {
    enabled: false,
    maxAgeInSecs: 3600,
  },
  requirePasswordForSensitiveOpts: false,
  accountsImported: [],
};

const generalAppSlice = createSlice({
  name: "app",
  initialState,
  reducers: {
    resetRequestsState: (state) => {
      state.externalRequests = [];
      state.requestsWindowId = null;
    },
    addExternalRequest: (state, action: PayloadAction<AppRequests>) => {
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
      action: PayloadAction<{
        origin: string;
        type: string;
        protocol: SupportedProtocols;
      }>
    ) => {
      const { origin, type, protocol } = action.payload;

      state.externalRequests = state.externalRequests.filter(
        (request) =>
          !(
            request.origin === origin &&
            request.type === type &&
            request.protocol === protocol
          )
      );
    },
    changeActiveTab: (
      state,
      action: PayloadAction<Required<GeneralAppSlice["activeTab"]>>
    ) => {
      state.activeTab = action.payload;
    },
    increaseErrorOfNetwork: (state, action: PayloadAction<string>) => {
      const path = ["errorsPreferredNetwork", action.payload];
      set(state, path, get(state, path, 0) + 1);
    },
    resetErrorOfNetwork: (state, action: PayloadAction<string>) => {
      const path = ["errorsPreferredNetwork", action.payload];
      set(state, path, 0);
    },
    setAppIsReadyStatus: (
      state,
      action: PayloadAction<GeneralAppSlice["isReadyStatus"]>
    ) => {
      state.isReadyStatus = action.payload;
    },
    addMintIdSent: (state, action: PayloadAction<string>) => {
      state.idOfMintsSent = [...state.idOfMintsSent, action.payload];
    },
    // this is here to only set that an account is loading after verifying it in the thunk
    setGetAccountPending: setGetAccountPendingFromNetwork,
  },
  extraReducers: (builder) => {
    addNetworksExtraReducers(builder);
    addContactThunksToBuilder(builder);

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
          selectedProtocol,
          selectedChainByProtocol,
          selectedAccountByProtocol,
          showTestNetworks,
          networksCanBeSelected,
          assetsIdByAccount,
          customRpcs,
          contacts,
          sessionMaxAge,
          requirePasswordForSensitiveOpts,
          accountsImported,
        } = action.payload;

        state.selectedProtocol = selectedProtocol;
        state.selectedChainByProtocol = selectedChainByProtocol;
        state.selectedAccountByProtocol = selectedAccountByProtocol;
        state.showTestNetworks = showTestNetworks;
        state.networksCanBeSelected = networksCanBeSelected;
        state.assetsIdByAccount = assetsIdByAccount;
        state.customRpcs = customRpcs;
        state.contacts = contacts;
        state.sessionsMaxAge = sessionMaxAge;
        state.requirePasswordForSensitiveOpts = requirePasswordForSensitiveOpts;
        state.accountsImported = accountsImported;
        state.isReadyStatus = "yes";
      }
    );
    builder.addCase(changeSelectedNetwork.fulfilled, (state, action) => {
      const {
        selectedProtocol,
        selectedChainByProtocol,
        selectedAccountByProtocol,
      } = action.payload;

      state.selectedProtocol = selectedProtocol;
      state.selectedChainByProtocol = selectedChainByProtocol;
      state.selectedAccountByProtocol = selectedAccountByProtocol;
    });
    builder.addCase(
      changeSelectedAccountOfNetwork.fulfilled,
      (state, action) => {
        state.selectedAccountByProtocol = action.payload;
      }
    );

    builder.addCase(toggleShowTestNetworks.fulfilled, (state, action) => {
      state.showTestNetworks = action.payload;
    });

    builder.addCase(toggleNetworkCanBeSelected.fulfilled, (state, action) => {
      state.networksCanBeSelected = action.payload;
    });

    builder.addCase(toggleAssetOfAccount.fulfilled, (state, action) => {
      state.assetsIdByAccount = action.payload;
    });

    builder.addCase(setSessionMaxAgeData.fulfilled, (state, action) => {
      state.sessionsMaxAge = action.payload;
    });

    builder.addCase(
      setRequirePasswordSensitiveOpts.fulfilled,
      (state, action) => {
        state.requirePasswordForSensitiveOpts = action.payload;
      }
    );

    builder.addCase(addImportedAccountAddress.fulfilled, (state, action) => {
      state.accountsImported = action.payload;
    });

    builder.addCase(removeImportedAccountAddress.fulfilled, (state, action) => {
      state.accountsImported = action.payload;
    });

    builder.addCase(
      importAppSettings.fulfilled,
      (state, { payload: settings }) => {
        const {
          assetsIdByAccount,
          selectedAccountByProtocol,
          selectedChainByProtocol,
          selectedProtocol,
          networksCanBeSelected,
          customRpcs,
          contacts,
          sessionsMaxAge,
          requirePasswordForSensitiveOpts,
          accountsImported,
        } = settings;

        state.assetsIdByAccount = assetsIdByAccount;
        state.selectedAccountByProtocol = selectedAccountByProtocol;
        state.selectedChainByProtocol = selectedChainByProtocol;
        state.selectedProtocol = selectedProtocol;
        state.networksCanBeSelected =
          networksCanBeSelected as NetworkCanBeSelectedMap;
        state.customRpcs = customRpcs as CustomRPC[];
        state.contacts = contacts as SerializedAccountReference[];
        state.sessionsMaxAge =
          sessionsMaxAge as GeneralAppSlice["sessionsMaxAge"];
        state.requirePasswordForSensitiveOpts = requirePasswordForSensitiveOpts;
        state.accountsImported = accountsImported;
      }
    );
  },
});

export const {
  resetRequestsState,
  removeExternalRequest,
  addExternalRequest,
  addWindow,
  setGetAccountPending,
  changeActiveTab,
  increaseErrorOfNetwork,
  resetErrorOfNetwork,
  setAppIsReadyStatus,
  addMintIdSent,
} = generalAppSlice.actions;

export default generalAppSlice.reducer;
