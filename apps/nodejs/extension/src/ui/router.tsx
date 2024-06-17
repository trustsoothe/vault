import React from "react";
import { createHashRouter } from "react-router-dom";
import Preferences from "./Preferences/Preferences";
import {
  CONTACTS_PAGE,
  EXPORT_VAULT_PAGE,
  IMPORT_SEEDS_PAGE,
  MANAGE_ACCOUNTS_PAGE,
  NETWORKS_PAGE,
  NEW_SEEDS_PAGE,
  PREFERENCES_PAGE,
  REQUEST_CONNECTION_PAGE,
  SEEDS_PAGE,
} from "../constants/routes";
import Header from "./Header/Header";
import Home from "./Home/Home";
import Seeds from "./Seeds/Seeds";
import ContactList from "./Contacts/List";
import ImportSeed from "./Seeds/ImportSeed";
import CreateNewSeed from "./Seeds/CreateNewSeed";
import ManageAccounts from "./ManageAccounts/ManageAccounts";
import ConnectionRequest from "./Request/ConnectionRequest";
import Networks from "./Networks/Networks";
import Handler from "./Request/Handler";
import Backup from "./Backup/Backup";

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
    ],
  },
]);
