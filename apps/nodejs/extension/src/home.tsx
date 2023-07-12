import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import InitializeVault from "./components/InitializeVault";
import UnlockVault from "./components/UnlockVault";
import { Store, applyMiddleware } from "webext-redux";
import { Provider, connect } from "react-redux";
import { RootState } from "./redux/store";
import Header from "./components/common/Header";
import thunkMiddleware from "redux-thunk";
import ListSessions from "./components/Session/List";
import AccountList from "./components/Account/List";
import Request from "./components/Session/Request";
import CircularLoading from "./components/common/CircularLoading";
import NetworkList from "./components/Network/List";
import AssetList from "./components/Asset/List";
import { createHashRouter, RouterProvider } from "react-router-dom";
import {
  ACCOUNTS_PAGE,
  ASSETS_PAGE,
  CREATE_ACCOUNT_PAGE,
  IMPORT_ACCOUNT_PAGE,
  NETWORKS_PAGE,
  REQUEST_CONNECTION_PAGE,
  SESSIONS_PAGE,
  TRANSFER_PAGE,
} from "./constants/routes";
import CreateNewAccount from "./components/Account/CreateNew";
import ImportAccount from "./components/Account/Import";
import RequestHandler from "./components/RequestHandler";
import Transfer from "./components/Transfer";

const store = new Store();
const storeWithMiddleware = applyMiddleware(store, thunkMiddleware);

const router = createHashRouter([
  {
    path: "",
    element: <Header />,
    children: [
      {
        path: ACCOUNTS_PAGE,
        element: <AccountList />,
      },
      {
        path: SESSIONS_PAGE,
        element: <ListSessions />,
      },
      {
        path: NETWORKS_PAGE,
        element: <NetworkList />,
      },
      {
        path: ASSETS_PAGE,
        element: <AssetList />,
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

const requestRouter = createHashRouter([
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
        element: <Request />,
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

interface HomeProps {
  initializeStatus: RootState["vault"]["initializeStatus"];
  vaultSession: RootState["vault"]["vaultSession"];
  externalRequests: RootState["app"]["externalRequests"];
}

const Home: React.FC<HomeProps> = ({
  initializeStatus,
  vaultSession,
  externalRequests,
}) => {
  const [view, setView] = useState("loading");
  // useEffect(() => {
  //   browser.storage.local.clear().then(() => console.log("cleared"));
  // }, []);

  useEffect(() => {
    const isSessionRequest = window.location.search.includes("view=request");
    setView(isSessionRequest ? "session-request" : "normal");
  }, []);

  const content = useMemo(() => {
    // return ;

    if (initializeStatus === "loading" || view === "loading") {
      return <CircularLoading />;
    }

    if (initializeStatus === "none") {
      return <InitializeVault />;
    }

    if (vaultSession) {
      if (view === "session-request") {
        return (
          <Stack flexGrow={1}>
            <RouterProvider router={requestRouter} />
          </Stack>
        );
      }
      return (
        <Stack flexGrow={1}>
          <RouterProvider router={router} />
        </Stack>
      );
    }

    return <UnlockVault />;
  }, [initializeStatus, vaultSession, view, externalRequests]);

  return (
    <Box
      sx={{
        width: "calc(100% + 16px)",
        marginY: "-8px",
        height: "calc(100vh)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        marginLeft: "-8px",
      }}
    >
      <Paper
        sx={{
          height: 510,
          width: 400,
          paddingX: "20px",
          paddingTop: "15px",
          paddingBottom: "20px",
          boxSizing: "border-box",
          display: "flex",
        }}
        elevation={2}
      >
        {content}
      </Paper>
    </Box>
  );
};

const mapStateToProps = (state: RootState) => ({
  ...state?.vault,
  ...state.app,
});

const ConnectedHome = connect(mapStateToProps)(Home);

storeWithMiddleware.ready().then(() => {
  const root = createRoot(document.getElementById("root")!);

  root.render(
    <React.StrictMode>
      <Provider store={storeWithMiddleware}>
        <ConnectedHome />
      </Provider>
    </React.StrictMode>
  );
});
