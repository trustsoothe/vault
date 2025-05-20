import React from "react";
import { createHashRouter } from "react-router-dom";
import Preferences from "./Preferences/Preferences";
import {
  ACTIVITY_PAGE,
  BULK_PERSONAL_SIGN_PAGE,
  CHANGE_SELECTED_CHAIN_PAGE,
  CONTACTS_PAGE,
  EXPORT_VAULT_PAGE,
  IMPORT_SEEDS_PAGE,
  MANAGE_ACCOUNTS_PAGE,
  NETWORKS_PAGE,
  NEW_SEEDS_PAGE,
  PERSONAL_SIGN_PAGE,
  POKT_TRANSACTION_PAGE,
  PREFERENCES_PAGE,
  REQUEST_CONNECTION_PAGE,
  SEEDS_PAGE,
  SIGN_TRANSACTIONS_PAGE,
  SIGN_TYPED_DATA_PAGE,
  SITES_PAGE,
  TRANSFER_PAGE,
} from "../constants/routes";
import Header from "./Header/Header";
import Home from "./Home/Home";
import Seeds from "./Seeds/Seeds";
import ContactList from "./Contacts/List";
import ImportSeed from "./Seeds/ImportSeed";
import CreateNewSeed from "./Seeds/CreateNewSeed";
import ManageAccounts from "./ManageAccounts/ManageAccounts";
import PoktTransactionRequest from "./Request/PoktTransactionRequest";
import SiteConnections from "./SiteConnections/SiteConnections";
import TransactionRequest from "./Request/TransactionRequest";
import ConnectionRequest from "./Request/ConnectionRequest";
import SwitchNetwork from "./Request/SwitchNetwork";
import SignTypedData from "./Request/SignTypedData";
import PersonalSign from "./Request/PersonalSign";
import Networks from "./Networks/Networks";
import Activity from "./Activity/Activity";
import Handler from "./Request/Handler";
import Backup from "./Backup/Backup";
import PoktSignTransactionRequest from "./Request/PoktSignTransactionRequest";
import BulkPersonalSign from "./Request/BulkPersonalSign";

export const router = createHashRouter([
  {
    path: "",
    element: <Header />,
    children: [
      {
        path: "",
        element: <Home />,
      },
      {
        path: PREFERENCES_PAGE,
        element: <Preferences />,
      },
      {
        path: SEEDS_PAGE,
        element: <Seeds />,
      },
      {
        path: IMPORT_SEEDS_PAGE,
        element: <ImportSeed />,
      },
      {
        path: NEW_SEEDS_PAGE,
        element: <CreateNewSeed />,
      },
      {
        path: MANAGE_ACCOUNTS_PAGE,
        element: <ManageAccounts />,
      },
      {
        path: CONTACTS_PAGE,
        element: <ContactList />,
      },
      {
        path: EXPORT_VAULT_PAGE,
        element: <Backup />,
      },
      {
        path: NETWORKS_PAGE,
        element: <Networks />,
      },
      {
        path: SITES_PAGE,
        element: <SiteConnections />,
      },
      {
        path: ACTIVITY_PAGE,
        element: <Activity />,
      },
    ],
  },
]);

export const requestRouter = createHashRouter([
  {
    path: "",
    element: <Handler />,
    children: [
      {
        path: REQUEST_CONNECTION_PAGE,
        element: <ConnectionRequest />,
      },
      {
        path: PERSONAL_SIGN_PAGE,
        element: <PersonalSign />,
      },
      {
        path: BULK_PERSONAL_SIGN_PAGE,
        element: <BulkPersonalSign />,
      },
      {
        path: CHANGE_SELECTED_CHAIN_PAGE,
        element: <SwitchNetwork />,
      },
      {
        path: SIGN_TYPED_DATA_PAGE,
        element: <SignTypedData />,
      },
      {
        path: TRANSFER_PAGE,
        element: <TransactionRequest />,
      },
      {
        path: POKT_TRANSACTION_PAGE,
        element: <PoktTransactionRequest />,
      },
      {
        path: SIGN_TRANSACTIONS_PAGE,
        element: <PoktSignTransactionRequest />,
      },
    ],
  },
]);
