import React, { useEffect, useMemo, useState } from "react";
import GlobalStyles from "@mui/material/GlobalStyles";
import { RouterProvider } from "react-router-dom";
import { createRoot } from "react-dom/client";
import browser from "webextension-polyfill";
import { useTheme } from "@mui/material";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import InitializeVault from "./components/InitializeVault";
import UnlockVault from "./components/UnlockVault";
import { Store, applyMiddleware } from "webext-redux";
import { Provider } from "react-redux";
import thunkMiddleware from "redux-thunk";
import CircularLoading from "./components/common/CircularLoading";
import ThemeProvider from "./theme";
import { SnackbarProvider } from "notistack";
import { closeCurrentWindow, removeRequestWithRes } from "./utils/ui";
import { MINUTES_ALLOWED_FOR_REQ } from "./constants/communication";
import { RequestTimeout } from "./errors/communication";
import { useAppDispatch, useAppSelector } from "./hooks/redux";
import useIsPopup from "./hooks/useIsPopup";
import { HEIGHT, WIDTH } from "./constants/ui";
import SuccessIcon from "./assets/img/success_icon.svg";
import { pricesApi } from "./redux/slices/prices";
import { requestRouter, router } from "./constants/routers";
import {
  externalRequestsSelector,
  initializeStatusSelector,
  vaultSessionExistsSelector,
} from "./redux/selectors/session";

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

const Home: React.FC = () => {
  const dispatch = useAppDispatch();
  const theme = useTheme();
  const [view, setView] = useState("loading");
  const isPopup = useIsPopup();

  useEffect(() => {
    // todo: improve this?
    const isSessionRequest = window.location.search.includes("view=request");
    setView(isSessionRequest ? "session-request" : "normal");
  }, []);

  const externalRequests = useAppSelector(externalRequestsSelector);
  const initializeStatus = useAppSelector(initializeStatusSelector);
  const vaultSessionExists = useAppSelector(vaultSessionExistsSelector);

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

    if (vaultSessionExists) {
      return (
        <Stack flexGrow={1}>
          <RouterProvider
            router={view === "session-request" ? requestRouter : router}
          />
        </Stack>
      );
    }

    return <UnlockVault />;
  }, [initializeStatus, vaultSessionExists, view]);

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

// to only display the UI when the servicer worker is activated and avoid blank UI
browser.runtime.sendMessage({ type: "WAIT_BACKGROUND" }).then(() => {
  storeWithMiddleware.ready().then(() => {
    const root = createRoot(document.getElementById("root")!);

    root.render(
      <Provider store={storeWithMiddleware}>
        <ThemeProvider>
          <Home />
        </ThemeProvider>
      </Provider>
    );
  });
});
