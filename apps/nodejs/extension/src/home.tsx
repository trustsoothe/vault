import React, { useCallback, useEffect, useMemo, useState } from "react";
import GlobalStyles from "@mui/material/GlobalStyles";
import { RouterProvider } from "react-router-dom";
import { createRoot } from "react-dom/client";
import browser, { Permissions } from "webextension-polyfill";
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
import { SnackbarProvider } from "notistack";
import { closeCurrentWindow, removeRequestWithRes } from "./utils/ui";
import {
  APP_IS_READY_REQUEST,
  MINUTES_ALLOWED_FOR_REQ,
} from "./constants/communication";
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
import InfoIcon from "./components/common/InfoIcon";
import OperationFailed from "./components/common/OperationFailed";
import ErrorIcon from "./components/common/ErrorIcon";
import WarningIcon from "./components/common/WarningIcon";
import { isFirefox } from "./utils";
import { requiredOrigins } from "./constants/permissions";
import RequestOriginsPermission from "./components/RequestOriginsPermission";
import App from "./ui";

const store = new Store();
const storeWithMiddleware = applyMiddleware(
  store,
  thunkMiddleware,
  // this middleware is a fix for firefox and the rtk queries, because Store complains about not being able to clone objects
  (_) => (next) => (action) => {
    return next(JSON.parse(JSON.stringify(action)));
  },
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
  const [hasOriginPermissionsStatus, setHasOriginPermissionsStatus] = useState<
    "yes" | "no" | "loading"
  >(isFirefox() ? "loading" : "yes");

  useEffect(() => {
    // todo: improve this?
    const isSessionRequest = window.location.search.includes("view=request");
    setView(isSessionRequest ? "session-request" : "normal");

    // this is to handle the origins permissions in firefox because in firefox with manifest v3 this permission is optional by default
    // so we are ensuring the user granted the extension this permission before using it to be sure the extension is going to work properly
    const onRemovedPermissionListener = (
      permissions: Permissions.Permissions
    ) => {
      if (
        !permissions.permissions?.length &&
        permissions.origins?.length === 2 &&
        permissions.origins.at(0) === requiredOrigins.at(0) &&
        permissions.origins.at(1) === requiredOrigins.at(1)
      ) {
        setHasOriginPermissionsStatus("no");
      }
    };

    let listenerAdded = false;

    if (isFirefox()) {
      browser.permissions
        .contains({
          origins: requiredOrigins,
        })
        .then((containsPermission) => {
          setHasOriginPermissionsStatus(!containsPermission ? "no" : "yes");
        });

      browser.permissions.onRemoved.addListener(onRemovedPermissionListener);
      listenerAdded = true;
    }

    return () => {
      if (listenerAdded) {
        browser.permissions.onRemoved.removeListener(
          onRemovedPermissionListener
        );
      }
    };
  }, []);

  const externalRequests = useAppSelector(externalRequestsSelector);
  const initializeStatus = useAppSelector(initializeStatusSelector);
  const vaultSessionExists = useAppSelector(vaultSessionExistsSelector);
  const appStatus = useAppSelector((state) => state.app.isReadyStatus);

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

  const retryInitExtension = useCallback(() => {
    browser.runtime.sendMessage({ type: APP_IS_READY_REQUEST }).catch();
  }, [dispatch]);

  const content = useMemo(() => {
    if (
      initializeStatus === "loading" ||
      view === "loading" ||
      appStatus === "loading" ||
      hasOriginPermissionsStatus === "loading"
    ) {
      return <CircularLoading />;
    }

    if (appStatus === "error") {
      return (
        <OperationFailed
          text={"Error trying to initialize the extension."}
          retryBtnProps={{
            type: "button",
          }}
          onRetry={retryInitExtension}
        />
      );
    }

    if (hasOriginPermissionsStatus === "no") {
      return (
        <RequestOriginsPermission
          onGranted={() => setHasOriginPermissionsStatus("yes")}
        />
      );
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
  }, [
    initializeStatus,
    vaultSessionExists,
    view,
    appStatus,
    retryInitExtension,
    hasOriginPermissionsStatus,
  ]);

  return (
    <>
      <GlobalStyles
        styles={{
          body: {
            width: isPopup ? WIDTH : undefined,
            height: isPopup ? HEIGHT : undefined,
            margin: "0!important",
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
          width: "100vw",
          maxWidth: isPopup ? WIDTH : undefined,
          height: "calc(100vh)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
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
              "&:has(.notistack-MuiContent-warning)": {
                height: 60,
                bottom: 15,
              },
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
            "& .notistack-MuiContent-info": {
              backgroundColor: theme.customColors.primary100,
              border: `1px solid ${theme.customColors.primary250}`,
              boxShadow: "none",
            },
            "& .notistack-MuiContent-error": {
              backgroundColor: theme.customColors.red25,
              border: `1px solid ${theme.customColors.red50}`,
              boxShadow: "none",
            },
            "& .notistack-MuiContent-warning": {
              backgroundColor: "#fff5ec",
              border: `1px solid #ffb850`,
              boxShadow: "none",
              height: "60px!important",
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
            autoHideDuration={6000}
            preventDuplicate={true}
            iconVariant={{
              success: <SuccessIcon />,
              info: <InfoIcon />,
              error: <ErrorIcon />,
              warning: <WarningIcon />,
            }}
          />
          {content}
        </Paper>
      </Box>
    </>
  );
};

// to only display the UI when the servicer worker is activated and avoid blank UI
browser.runtime.sendMessage({ type: APP_IS_READY_REQUEST }).then(() => {
  storeWithMiddleware.ready().then(() => {
    const root = createRoot(document.getElementById("root")!);

    root.render(
      <Provider store={storeWithMiddleware}>
        <App />
        {/*<ThemeProvider>*/}
        {/*  <Home />*/}
        {/*</ThemeProvider>*/}
      </Provider>
    );
  });
});
