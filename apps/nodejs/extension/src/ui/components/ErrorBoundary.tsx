import type { AppRequests } from "../../types/communications";
import {
  isRouteErrorResponse,
  useLocation,
  useNavigate,
  useRouteError,
} from "react-router-dom";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import React, { useEffect } from "react";
import Button from "@mui/material/Button";
import browser from "webextension-polyfill";
import { OpenInNew } from "@mui/icons-material";
import Typography from "@mui/material/Typography";
import { selectedAccountByProtocolSelector } from "../../redux/selectors/account";
import { convertErrorToJson } from "../../utils/networkOperations";
import useSelectedAsset from "../Home/hooks/useSelectedAsset";
import { enqueueErrorSnackbar } from "../../utils/ui";
import { useAppSelector } from "../hooks/redux";
import GrayContainer from "./GrayContainer";
import { requestRouter } from "../router";
import ErrorExpand from "./ErrorExpand";
import { themeColors } from "../theme";
import Header from "../Header/Header";
import {
  selectedChainByProtocolSelector,
  selectedProtocolSelector,
} from "../../redux/selectors/network";
import ReportLink from "./ReportLink";

interface CloseOrHomeButtonProps {
  close?: boolean;
  variant?: "contained";
}

function CloseOrHomeButton({ close, variant }: CloseOrHomeButtonProps) {
  const navigate = useNavigate();
  const requestWindowId = useAppSelector((state) => state.app.requestsWindowId);

  function handleClick() {
    if (close) {
      browser.windows.remove(requestWindowId).catch(() => {
        enqueueErrorSnackbar({
          message: "There was an error closing this view",
          variant: "error",
          key: "close_view_err",
          preventDuplicate: true,
          onRetry: handleClick,
        });
      });
    } else {
      navigate("/");
    }
  }

  return (
    <Button
      variant={variant}
      sx={{
        height: 30,
      }}
      onClick={handleClick}
    >
      {close ? "Close" : "Go Home"}
    </Button>
  );
}

interface ErrorBoundaryProps {
  isRequestRouter?: boolean;
}

export default function ErrorFallback({ isRequestRouter }: ErrorBoundaryProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const error = useRouteError();
  const selectedProtocol = useAppSelector(selectedProtocolSelector);
  const selectedChainByProtocol = useAppSelector(
    selectedChainByProtocolSelector
  );
  const request: AppRequests = location.state;
  const selectedAddress = useAppSelector(selectedAccountByProtocolSelector);
  const selectedAsset = useSelectedAsset();

  // if we are at a request page, we should redirect to home
  useEffect(() => {
    if (isRequestRouter) return;

    if (
      requestRouter.routes
        .at(0)
        ?.children?.some((route) => route.path === location.pathname)
    ) {
      navigate("");
    }
  }, [location.pathname]);

  // this route error should only happen when a not found happens
  // because we don't have loaders or actions
  if (isRouteErrorResponse(error) && error.status === 404) {
    const errorComponent = (
      <>
        <Stack
          flexGrow={1}
          width={1}
          sx={{
            backgroundColor: themeColors.white,
          }}
        >
          <GrayContainer
            sx={{
              height: 250,
              paddingBottom: 4,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: themeColors.bgLightGray,
            }}
          >
            <Typography
              color={themeColors.black}
              fontFamily={"sans-serif"}
              fontWeight={500}
              fontSize={20}
            >
              Page Not Found
            </Typography>
            <CloseOrHomeButton close={isRequestRouter} />
          </GrayContainer>
        </Stack>
      </>
    );

    if (isRequestRouter) {
      return errorComponent;
    }

    return <Header>{errorComponent}</Header>;
  }

  const errorString = JSON.stringify(
    {
      url: window.location.hash,
      protocol: selectedProtocol,
      network: selectedChainByProtocol[selectedProtocol],
      account: selectedAddress[selectedProtocol],
      asset: selectedAsset || undefined,
      error: convertErrorToJson(error),
      request: isRequestRouter ? request : undefined,
    },
    null,
    2
  );

  const errorComponent = (
    <>
      <Stack
        flexGrow={1}
        width={1}
        sx={{
          backgroundColor: themeColors.bgLightGray,
        }}
      >
        <GrayContainer
          sx={{
            height: 200,
            paddingBottom: 5,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: themeColors.bgLightGray,
          }}
        >
          <Typography
            color={themeColors.black}
            fontFamily={"sans-serif"}
            letterSpacing={"1px"}
            fontWeight={500}
            fontSize={20}
          >
            Oops
          </Typography>
          <Typography
            color={themeColors.black}
            letterSpacing={"0.3px"}
            fontFamily={"sans-serif"}
            fontWeight={500}
            fontSize={16}
          >
            Something went wrong.
          </Typography>
          <Stack
            direction={"row"}
            alignItems={"center"}
            spacing={1}
            marginTop={1}
          >
            <CloseOrHomeButton variant={"contained"} close={isRequestRouter} />
            <Button
              sx={{
                height: 30,
              }}
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </Stack>
        </GrayContainer>
        <Stack
          flexGrow={1}
          boxSizing={"border-box"}
          bgcolor={themeColors.white}
          paddingY={1.2}
          paddingRight={1.6}
          paddingLeft={2}
        >
          <Typography variant={"subtitle2"} marginLeft={-0.6}>
            Would like to report this error?
          </Typography>
          <ErrorExpand errorString={errorString} />
          <Typography fontSize={10} marginTop={-0.4} marginBottom={1}>
            Note: this info will never contain any sensitive information.
          </Typography>

          <ReportLink
            href={`https://github.com/trustsoothe/vault/issues/new?template=bug_report.md&labels=user-bug-reports,bug&type=bug&title=[BUG] Crash on ${window.location.hash.substring(
              1
            )}`}
          />
        </Stack>
      </Stack>
    </>
  );

  if (isRequestRouter) {
    return errorComponent;
  }

  return <Header>{errorComponent}</Header>;
}
