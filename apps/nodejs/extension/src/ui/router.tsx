import React from "react";
import { createHashRouter } from "react-router-dom";
import Preferences from "./Preferences/Preferences";
import {
  CONTACTS_PAGE,
  IMPORT_SEEDS_PAGE,
  MANAGE_ACCOUNTS_PAGE,
  NEW_SEEDS_PAGE,
  PREFERENCES_PAGE,
  SEEDS_PAGE,
} from "../constants/routes";
import Header from "./Header/Header";
import Home from "./Home/Home";
import Seeds from "./Seeds/Seeds";
import ContactList from "./Contacts/List";
import ImportSeed from "./Seeds/ImportSeed";
import CreateNewSeed from "./Seeds/CreateNewSeed";
import ManageAccounts from "./ManageAccounts/ManageAccounts";

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
    ],
  },
]);
