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
  ACCOUNTS_DETAIL_PAGE,
  ACCOUNTS_PAGE,
  ADD_NETWORK_PAGE,
  ASSETS_PAGE,
  BLOCK_SITE_PAGE,
  BLOCKED_SITES_PAGE,
  CONNECTED_SITE_DETAIL_PAGE,
  CREATE_ACCOUNT_PAGE,
  DISCONNECT_SITE_PAGE,
  IMPORT_ACCOUNT_PAGE,
  NETWORKS_PAGE,
  REMOVE_ACCOUNT_PAGE,
  REMOVE_NETWORK_PAGE,
  REQUEST_CONNECTION_PAGE,
  SESSIONS_PAGE,
  TRANSFER_PAGE,
  UNBLOCK_SITE_PAGE,
  UPDATE_ACCOUNT_PAGE,
  UPDATE_NETWORK_PAGE,
} from "./constants/routes";
import CreateNewAccount from "./components/Account/CreateNew";
import ImportAccount from "./components/Account/Import";
import RequestHandler, {
  closeCurrentWindow,
  removeRequestWithRes,
} from "./components/RequestHandler";
import Transfer from "./components/Transfer";
import ThemeProvider from "./theme";
import AccountDetail from "./components/Account/AccountDetail";
import RemoveAccount from "./components/Account/Remove";
import UpdateAccount from "./components/Account/Update";
import { SnackbarProvider } from "notistack";
import AddUpdateNetwork from "./components/Network/AddUpdate";
import RemoveNetwork from "./components/Network/Remove";
import SessionDetail from "./components/Session/SessionDetail";
import BlockedList from "./components/Session/BlockedList";
import DisconnectSite from "./components/Session/DisconnectSite";
import ToggleBlockSite from "./components/Session/ToggleBlockSite";
import { MINUTES_ALLOWED_FOR_REQ } from "./constants/communication";
import { RequestTimeout } from "./errors/communication";
import { useAppDispatch } from "./hooks/redux";

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
        path: ACCOUNTS_DETAIL_PAGE,
        element: <AccountDetail />,
      },
      {
        path: REMOVE_ACCOUNT_PAGE,
        element: <RemoveAccount />,
      },
      {
        path: UPDATE_ACCOUNT_PAGE,
        element: <UpdateAccount />,
      },
      {
        path: SESSIONS_PAGE,
        element: <ListSessions />,
      },
      {
        path: CONNECTED_SITE_DETAIL_PAGE,
        element: <SessionDetail />,
      },
      {
        path: DISCONNECT_SITE_PAGE,
        element: <DisconnectSite />,
      },
      {
        path: BLOCKED_SITES_PAGE,
        element: <BlockedList />,
      },
      {
        path: BLOCK_SITE_PAGE,
        element: <ToggleBlockSite />,
      },
      {
        path: UNBLOCK_SITE_PAGE,
        element: <ToggleBlockSite />,
      },
      {
        path: NETWORKS_PAGE,
        element: <NetworkList />,
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
  const dispatch = useAppDispatch();
  const [view, setView] = useState("loading");
  const [isPopup, setIsPopup] = useState(false);

  useEffect(() => {
    // todo: improve this?
    const isSessionRequest = window.location.search.includes("view=request");
    setView(isSessionRequest ? "session-request" : "normal");
    setIsPopup(window.location.search.includes("popup=true"));
  }, []);

  useEffect(() => {
    const interval = setInterval(async () => {
      const length = externalRequests.length;
      let requestsRemoved = 0;

      for (const request of externalRequests) {
        if (
          request.requestedAt &&
          request.requestedAt >
            new Date().getTime() - MINUTES_ALLOWED_FOR_REQ * 60000
        ) {
          continue;
        }

        await removeRequestWithRes(
          request,
          RequestTimeout,
          dispatch,
          externalRequests.length
        );
        requestsRemoved++;
      }

      if (view === "session-request" && length - requestsRemoved === 0) {
        await closeCurrentWindow();
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [externalRequests, dispatch, view]);

  const content = useMemo(() => {
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
  }, [initializeStatus, vaultSession, view]);

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
        maxHeight: isPopup ? 510 : undefined,
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
          position: "relative",
          display: "flex",
          "& .notistack-SnackbarContainer": {
            position: "absolute",
            height: 30,
          },
          "& .notistack-CollapseWrapper": {
            padding: 0,
          },
          "& .notistack-Snackbar": {
            minWidth: "0!important",
          },
          "& #notistack-snackbar": {
            padding: 0,
            marginLeft: 1,
          },
        }}
        elevation={2}
      >
        <SnackbarProvider
          style={{
            height: 30,
            fontSize: 12,
            display: "flex",
            alignItems: "center",
            padding: 0,
          }}
          maxSnack={1}
          preventDuplicate={true}
        />
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
        <ThemeProvider>
          <ConnectedHome />
        </ThemeProvider>
      </Provider>
    </React.StrictMode>
  );
});
