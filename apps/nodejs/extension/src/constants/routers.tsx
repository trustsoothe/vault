import { createHashRouter } from "react-router-dom";
import Header from "../components/Header";
import {
  ACCOUNT_PK_PAGE,
  ACCOUNTS_PAGE,
  ADD_NETWORK_PAGE,
  BLOCK_SITE_PAGE,
  CHANGE_SELECTED_CHAIN_PAGE,
  CONTACTS_PAGE,
  CREATE_NEW_HD_WALLETS_PAGE,
  DISCONNECT_SITE_PAGE,
  EXPORT_VAULT_PAGE,
  HD_WALLETS_PAGE,
  IMPORT_ACCOUNT_PAGE,
  IMPORT_HD_WALLET_PAGE,
  NETWORKS_PAGE,
  PERSONAL_SIGN_PAGE,
  PREFERENCES_PAGE,
  REMOVE_CONTACT_PAGE,
  REMOVE_NETWORK_PAGE,
  REQUEST_CONNECTION_PAGE,
  SAVE_CONTACT_PAGE,
  SIGN_TYPED_DATA_PAGE,
  SITES_PAGE,
  TRANSFER_PAGE,
  UNBLOCK_SITE_PAGE,
  UPDATE_NETWORK_PAGE,
} from "./routes";
import SelectedAccount from "../components/Account/SelectedAccount";
import ViewPrivateKey from "../components/Account/ViewPrivateKey";
import Sites from "../components/Session";
import DisconnectSite from "../components/Session/DisconnectSite";
import { ToggleBlockSiteFromRouter } from "../components/Session/ToggleBlockSite";
import Network from "../components/Network";
import AddUpdateNetwork from "../components/Network/AddUpdate";
import RemoveNetwork from "../components/Network/Remove";
import ImportAccount from "../components/Account/Import";
import Transfer from "../components/Transfer";
import RequestHandler from "../components/RequestHandler";
import CircularLoading from "../components/common/CircularLoading";
import NewConnect from "../components/Session/NewConnect";
import React from "react";
import ContactList from "../components/Contact/List";
import SaveContact from "../components/Contact/SaveContact";
import RemoveContact from "../components/Contact/RemoveContact";
import ChangeSelectedChain from "../components/Network/ChangeChain";
import SignTypedData from "../components/Sign/TypedData";
import PersonalSign from "../components/Sign/Personal";
import Preferences from "../components/Preferences";
import ExportVault from "../components/Vault/Export";
import HDWallets from "../components/HDWallets";
import ImportHdWallet from "../components/HDWallets/Import";
import CreateNewHdWallet from "../components/HDWallets/CreateNew";

export const router = createHashRouter([
  {
    path: "",
    element: <Header />,
    children: [
      {
        path: ACCOUNTS_PAGE,
        element: <SelectedAccount />,
      },
      {
        path: ACCOUNT_PK_PAGE,
        element: <ViewPrivateKey />,
      },
      {
        path: SITES_PAGE,
        element: <Sites />,
      },
      {
        path: DISCONNECT_SITE_PAGE,
        element: <DisconnectSite />,
      },
      {
        path: BLOCK_SITE_PAGE,
        element: <ToggleBlockSiteFromRouter />,
      },
      {
        path: UNBLOCK_SITE_PAGE,
        element: <ToggleBlockSiteFromRouter />,
      },
      {
        path: NETWORKS_PAGE,
        element: <Network />,
      },
      {
        path: ADD_NETWORK_PAGE,
        element: <AddUpdateNetwork />,
      },
      {
        path: UPDATE_NETWORK_PAGE,
        element: <AddUpdateNetwork />,
      },
      {
        path: REMOVE_NETWORK_PAGE,
        element: <RemoveNetwork />,
      },
      {
        path: IMPORT_ACCOUNT_PAGE,
        element: <ImportAccount />,
      },
      {
        path: TRANSFER_PAGE,
        element: <Transfer />,
      },
      {
        path: CONTACTS_PAGE,
        element: <ContactList />,
      },
      {
        path: SAVE_CONTACT_PAGE,
        element: <SaveContact />,
      },
      {
        path: REMOVE_CONTACT_PAGE,
        element: <RemoveContact />,
      },
      {
        path: PREFERENCES_PAGE,
        element: <Preferences />,
      },
      {
        path: EXPORT_VAULT_PAGE,
        element: <ExportVault />,
      },
      {
        path: HD_WALLETS_PAGE,
        element: <HDWallets />,
      },
      {
        path: CREATE_NEW_HD_WALLETS_PAGE,
        element: <CreateNewHdWallet />,
      },
      {
        path: IMPORT_HD_WALLET_PAGE,
        element: <ImportHdWallet />,
      },
    ],
  },
]);

export const requestRouter = createHashRouter([
  {
    path: "",
    element: <RequestHandler />,
    children: [
      {
        path: "",
        element: <CircularLoading />,
      },
      {
        path: REQUEST_CONNECTION_PAGE,
        element: <NewConnect />,
      },
      {
        path: IMPORT_ACCOUNT_PAGE,
        element: <ImportAccount />,
      },
      {
        path: TRANSFER_PAGE,
        element: <Transfer />,
      },
      {
        path: CHANGE_SELECTED_CHAIN_PAGE,
        element: <ChangeSelectedChain />,
      },
      {
        path: SIGN_TYPED_DATA_PAGE,
        element: <SignTypedData />,
      },
      {
        path: PERSONAL_SIGN_PAGE,
        element: <PersonalSign />,
      },
    ],
  },
]);
