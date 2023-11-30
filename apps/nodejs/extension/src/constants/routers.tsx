import { createHashRouter } from "react-router-dom";
import Header from "../components/Header";
import {
  ACCOUNT_PK_PAGE,
  ACCOUNTS_PAGE,
  ADD_NETWORK_PAGE,
  BLOCK_SITE_PAGE,
  CONTACTS_PAGE,
  CREATE_ACCOUNT_PAGE,
  DISCONNECT_SITE_PAGE,
  IMPORT_ACCOUNT_PAGE,
  NETWORKS_PAGE,
  REMOVE_CONTACT_PAGE,
  REMOVE_NETWORK_PAGE,
  REQUEST_CONNECTION_PAGE,
  SAVE_CONTACT_PAGE,
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
import CreateNewAccount from "../components/Account/CreateNew";
import ImportAccount from "../components/Account/Import";
import Transfer from "../components/Transfer";
import RequestHandler from "../components/RequestHandler";
import CircularLoading from "../components/common/CircularLoading";
import NewConnect from "../components/Session/NewConnect";
import React from "react";
import ContactList from "../components/Contact/List";
import SaveContact from "../components/Contact/SaveContact";
import RemoveContact from "../components/Contact/RemoveContact";

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
        path: CREATE_ACCOUNT_PAGE,
        element: <CreateNewAccount />,
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
        path: CREATE_ACCOUNT_PAGE,
        element: <CreateNewAccount />,
      },
      {
        path: IMPORT_ACCOUNT_PAGE,
        element: <ImportAccount />,
      },
      {
        path: TRANSFER_PAGE,
        element: <Transfer />,
      },
    ],
  },
]);
