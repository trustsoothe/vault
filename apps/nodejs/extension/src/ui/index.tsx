import React, { useEffect, useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import { SnackbarProvider } from "notistack";
import GlobalStyles from "@mui/material/GlobalStyles";
import { APP_CONTAINER_ID, HEIGHT, WIDTH } from "../constants/ui";
import useIsPopup from "./hooks/useIsPopup";
import ThemeProvider, { themeColors } from "./theme";
import InitializeVault from "./InitializeVault/InitializeVault";
import { isFirefox } from "../utils";
import UnlockVault from "./UnlockVault/UnlockVault";
import { useAppDispatch, useAppSelector } from "../hooks/redux";
import browser, { Permissions } from "webextension-polyfill";
import { requiredOrigins } from "../constants/permissions";
import {
  externalRequestsSelector,
  initializeStatusSelector,
  vaultSessionExistsSelector,
} from "../redux/selectors/session";
import {
  APP_IS_READY_REQUEST,
  MINUTES_ALLOWED_FOR_REQ,
} from "../constants/communication";
import SuccessIcon from "./assets/img/success_icon.svg";
import WarningIcon from "./assets/img/rounded_close_icon.svg";
import RequestOriginsPermission from "./RequestOriginPermission/RequestOriginPermission";
import { closeCurrentWindow, removeRequestWithRes } from "../utils/ui";
import { RequestTimeout } from "../errors/communication";
import CircularLoading from "../components/common/CircularLoading";
import AppInitError from "./AppInitError/AppInitError";
import { RouterProvider } from "react-router-dom";
import { requestRouter, router } from "./router";

export default function App() {
  const isPopup = useIsPopup();
  const dispatch = useAppDispatch();
  const [view, setView] = useState("loading");
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

    browser.permissions
      .contains({
        origins: requiredOrigins,
      })
      .then((containsPermission) => {
        setHasOriginPermissionsStatus(!containsPermission ? "no" : "yes");
      });

    browser.permissions.onRemoved.addListener(onRemovedPermissionListener);

    return () => {
      browser.permissions.onRemoved.removeListener(onRemovedPermissionListener);
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

  const retryInitExtension = () => {
    browser.runtime.sendMessage({ type: APP_IS_READY_REQUEST }).catch();
  };

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
      return <AppInitError />;
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
    <ThemeProvider>
      <GlobalStyles
        styles={{
          body: {
            width: isPopup ? WIDTH : undefined,
            height: isPopup ? HEIGHT : undefined,
            margin: "0!important",
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
            boxSizing: "border-box",
            position: "relative",
            borderRadius: isPopup ? 0 : "8px",
            display: "flex",
            "& .notistack-SnackbarContainer": {
              bottom: 12,
              left: 12,
              position: "absolute",
              minHeight: 45,
              width: "376px!important",
              minWidth: "376px!important",
              maxWidth: "376px!important",
            },
            "& .notistack-CollapseWrapper": {
              padding: 0,
              width: "376px!important",
              minWidth: "376px!important",
              maxWidth: "376px!important",
            },
            "& #notistack-snackbar": {
              width: 1,
            },
            "& .notistack-MuiContent": {
              boxShadow: "0 4px 20px 0 rgba(0, 0, 0, 0.16)!important",
              backgroundColor: `${themeColors.black}!important`,
              borderRadius: "6px",
              paddingLeft: "14px!important",
              svg: {
                width: 18,
                minWidth: 17,
                height: 18,
                minHeight: 17,
              },
              "&:has(.title-with-content)": {
                svg: {
                  alignSelf: "flex-start",
                  marginTop: 0.2,
                },
                "& .okay-button": {
                  alignSelf: "flex-end",
                  marginRight: 0.4,
                  marginBottom: 0.4,
                },
              },
            },
          }}
          elevation={2}
          id={APP_CONTAINER_ID}
        >
          <SnackbarProvider
            style={{
              minHeight: 45,
              fontSize: 12,
              display: "flex",
              alignItems: "center",
              padding: 0,
              width: "376px!important",
              minWidth: "376px!important",
              maxWidth: "376px!important",
            }}
            maxSnack={1}
            autoHideDuration={6000}
            preventDuplicate={true}
            iconVariant={{
              success: <SuccessIcon />,
              error: <WarningIcon />,
              warning: <WarningIcon />,
            }}
          />
          {content}
        </Paper>
      </Box>
    </ThemeProvider>
  );
}
