import { createHashRouter, RouterProvider } from "react-router-dom";
import React, { useEffect, useMemo, useState } from "react";
import GlobalStyles from "@mui/material/GlobalStyles";
import { createRoot } from "react-dom/client";
import browser from "webextension-polyfill";
import { useTheme } from "@mui/material";
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
import CircularLoading from "./components/common/CircularLoading";
import NetworkList from "./components/Network/List";
import AssetList from "./components/Asset/List";
import {
  ACCOUNT_PK_PAGE,
  ACCOUNTS_PAGE,
  ADD_NETWORK_PAGE,
  ASSETS_PAGE,
  BLOCK_SITE_PAGE,
  CREATE_ACCOUNT_PAGE,
  DISCONNECT_SITE_PAGE,
  IMPORT_ACCOUNT_PAGE,
  NETWORKS_PAGE,
  REMOVE_ACCOUNT_PAGE,
  REMOVE_NETWORK_PAGE,
  REQUEST_CONNECTION_PAGE,
  SITES_PAGE,
  TRANSFER_PAGE,
  UNBLOCK_SITE_PAGE,
  UPDATE_NETWORK_PAGE,
} from "./constants/routes";
import CreateNewAccount from "./components/Account/CreateNew";
import ImportAccount from "./components/Account/Import";
import RequestHandler from "./components/RequestHandler";
import Transfer from "./components/Transfer";
import ThemeProvider from "./theme";
import RemoveAccount from "./components/Account/Remove";
import { SnackbarProvider } from "notistack";
import AddUpdateNetwork from "./components/Network/AddUpdate";
import RemoveNetwork from "./components/Network/Remove";
import DisconnectSite from "./components/Session/DisconnectSite";
import ViewPrivateKey from "./components/Account/ViewPrivateKey";
import { closeCurrentWindow, removeRequestWithRes } from "./utils/ui";
import { ToggleBlockSiteFromRouter } from "./components/Session/ToggleBlockSite";
import { MINUTES_ALLOWED_FOR_REQ } from "./constants/communication";
import { RequestTimeout } from "./errors/communication";
import { useAppDispatch } from "./hooks/redux";
import useIsPopup from "./hooks/useIsPopup";
import Sites from "./components/Session";
import { HEIGHT, WIDTH } from "./constants/ui";
import SuccessIcon from "./assets/img/success_icon.svg";
import NewConnect from "./components/Session/NewConnect";
import SelectedAccount from "./components/Account/SelectedAccount";
import { pricesApi } from "./redux/slices/prices";

const store = new Store();
const storeWithMiddleware = applyMiddleware(
  store,
  thunkMiddleware,
  pricesApi.middleware
);
Object.assign(storeWithMiddleware, {
  dispatch: storeWithMiddleware.dispatch.bind(storeWithMiddleware),
  getState: storeWithMiddleware.getState.bind(storeWithMiddleware),
  subscribe: storeWithMiddleware.subscribe.bind(storeWithMiddleware),
});

const router = createHashRouter([
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
        path: REMOVE_ACCOUNT_PAGE,
        element: <RemoveAccount />,
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
  const theme = useTheme();
  const [view, setView] = useState("loading");
  const isPopup = useIsPopup();

  useEffect(() => {
    // todo: improve this?
    const isSessionRequest = window.location.search.includes("view=request");
    setView(isSessionRequest ? "session-request" : "normal");
  }, []);

  useEffect(() => {
    if (vaultSession) {
      //todo: close vault if session is invalid
    }
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
    <>
      <GlobalStyles
        styles={{
          body: {
            width: isPopup ? 400 : undefined,
            marginLeft: isPopup ? 0 : undefined,
            marginRight: isPopup ? 0 : undefined,
            scrollbarColor: `${theme.customColors.dark25} ${theme.customColors.dark5}`,
            "&::-webkit-scrollbar, & *::-webkit-scrollbar": {
              width: "8px",
              height: "8px",
            },
            "&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb": {
              border: `2px solid transparent`,
              backgroundColor: theme.customColors.dark25,
              backgroundClip: "content-box",
              borderRadius: "12px",
            },
            "&::-webkit-scrollbar-track, & *::-webkit-scrollbar-track": {
              backgroundColor: theme.customColors.dark5,
              borderRadius: "50px",
            },
          },
        }}
      />
      <Box
        sx={{
          width: isPopup ? "calc(100% + 31px)" : "calc(100% + 16px)",
          maxWidth: isPopup ? WIDTH : undefined,
          marginY: "-8px",
          height: "calc(100vh)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginLeft: isPopup ? 0 : "-8px",
          maxHeight: isPopup ? HEIGHT : undefined,
        }}
      >
        <Paper
          sx={{
            height: HEIGHT,
            width: WIDTH,
            paddingBottom: "20px",
            boxSizing: "border-box",
            position: "relative",
            display: "flex",
            "& .notistack-SnackbarContainer": {
              bottom: 12,
              left: 10,
              position: "absolute",
              height: 55,
              width: "380px!important",
              minWidth: "380px!important",
              maxWidth: "380px!important",
            },
            "& .notistack-CollapseWrapper": {
              padding: 0,
              width: "380px!important",
              minWidth: "380px!important",
              maxWidth: "380px!important",
            },
            "& .notistack-Snackbar": {
              minWidth: "0!important",
            },
            "& #notistack-snackbar": {
              padding: 0,
              marginLeft: 1,
            },
            "& .notistack-MuiContent-success": {
              backgroundColor: theme.customColors.green5,
              border: `1px solid ${theme.customColors.dark_green}`,
              boxShadow: "none",
            },
          }}
          elevation={2}
        >
          <SnackbarProvider
            style={{
              height: 55,
              fontSize: 12,
              display: "flex",
              alignItems: "center",
              padding: 0,
              width: "380px!important",
              minWidth: "380px!important",
              maxWidth: "380px!important",
            }}
            maxSnack={1}
            autoHideDuration={4000}
            preventDuplicate={true}
            iconVariant={{
              success: <SuccessIcon />,
            }}
          />
          {content}
        </Paper>
      </Box>
    </>
  );
};

const mapStateToProps = (state: RootState) => ({
  vaultSession: state.vault.vaultSession,
  initializeStatus: state.vault.initializeStatus,
  externalRequests: state.app.externalRequests,
});

const ConnectedHome = connect(mapStateToProps)(Home);

// to only display the UI when the servicer worker is activated and avoid blank UI
browser.runtime.sendMessage({ type: "WAIT_BACKGROUND" }).then(() => {
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
});
