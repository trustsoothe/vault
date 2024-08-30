import type { AppRequests, UiResponsesToProxy } from "../types/communications";
import type { SupportedProtocols } from "@poktscan/vault";
import React from "react";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import browser from "webextension-polyfill";
import Typography from "@mui/material/Typography";
import {
  closeSnackbar,
  enqueueSnackbar as enqueueSnackbarNotistack,
  OptionsWithExtraProps,
  SnackbarKey,
  SnackbarMessage,
  VariantType,
} from "notistack";
import { removeExternalRequest } from "../redux/slices/app";
import {
  OperationRejected,
  RequestTimeout,
  UnauthorizedError,
} from "../errors/communication";
import { useAppDispatch } from "../ui/hooks/redux";
import { themeColors } from "../ui/theme";
import {
  CHANGE_PARAM_REQUEST,
  CHANGE_PARAM_RESPONSE,
  CONNECTION_REQUEST_MESSAGE,
  CONNECTION_RESPONSE_MESSAGE,
  DAO_TRANSFER_REQUEST,
  DAO_TRANSFER_RESPONSE,
  PERSONAL_SIGN_REQUEST,
  PERSONAL_SIGN_RESPONSE,
  SIGN_TYPED_DATA_REQUEST,
  SIGN_TYPED_DATA_RESPONSE,
  STAKE_APP_REQUEST,
  STAKE_APP_RESPONSE,
  STAKE_NODE_REQUEST,
  STAKE_NODE_RESPONSE,
  SWITCH_CHAIN_REQUEST,
  SWITCH_CHAIN_RESPONSE,
  TRANSFER_APP_REQUEST,
  TRANSFER_APP_RESPONSE,
  TRANSFER_REQUEST,
  TRANSFER_RESPONSE,
  UNJAIL_NODE_REQUEST,
  UNJAIL_NODE_RESPONSE,
  UNSTAKE_APP_REQUEST,
  UNSTAKE_APP_RESPONSE,
  UNSTAKE_NODE_REQUEST,
  UNSTAKE_NODE_RESPONSE,
} from "../constants/communication";

export const closeCurrentWindow = () =>
  browser.windows
    .getCurrent()
    .then((window) => browser.windows.remove(window.id));

export interface PartialRequest {
  origin: string;
  tabId: number;
  type: AppRequests["type"];
  sessionId?: string;
  protocol: SupportedProtocols;
  requestId: string;
}

export const removeRequestWithRes = async (
  request: PartialRequest,
  error:
    | typeof RequestTimeout
    | typeof OperationRejected
    | typeof UnauthorizedError,
  dispatch: ReturnType<typeof useAppDispatch>,
  requestsLength: number,
  closeWindow = false
) => {
  let responseType:
    | typeof TRANSFER_RESPONSE
    | typeof CONNECTION_RESPONSE_MESSAGE
    | typeof SWITCH_CHAIN_RESPONSE
    | typeof SIGN_TYPED_DATA_RESPONSE
    | typeof PERSONAL_SIGN_RESPONSE
    | typeof STAKE_NODE_RESPONSE
    | typeof UNSTAKE_NODE_RESPONSE
    | typeof UNJAIL_NODE_RESPONSE
    | typeof STAKE_APP_RESPONSE
    | typeof TRANSFER_APP_RESPONSE
    | typeof UNSTAKE_APP_RESPONSE
    | typeof CHANGE_PARAM_RESPONSE
    | typeof DAO_TRANSFER_RESPONSE;

  let data: UiResponsesToProxy["data"] = null;
  let errorToReturn: UiResponsesToProxy["error"] = null;

  if (error.code !== OperationRejected.code) {
    errorToReturn = error;
  }

  switch (request.type) {
    case STAKE_NODE_REQUEST:
    case UNSTAKE_NODE_REQUEST:
    case UNJAIL_NODE_REQUEST:
    case STAKE_APP_REQUEST:
    case TRANSFER_APP_REQUEST:
    case UNSTAKE_APP_REQUEST:
    case CHANGE_PARAM_REQUEST:
    case DAO_TRANSFER_REQUEST:
    case TRANSFER_REQUEST: {
      switch (request.type) {
        case TRANSFER_REQUEST: {
          responseType = TRANSFER_RESPONSE;
          break;
        }
        case STAKE_NODE_REQUEST: {
          responseType = STAKE_NODE_RESPONSE;
          break;
        }
        case UNSTAKE_NODE_REQUEST: {
          responseType = UNSTAKE_NODE_RESPONSE;
          break;
        }
        case UNJAIL_NODE_REQUEST: {
          responseType = UNJAIL_NODE_RESPONSE;
          break;
        }
        case STAKE_APP_REQUEST: {
          responseType = STAKE_APP_RESPONSE;
          break;
        }
        case TRANSFER_APP_REQUEST: {
          responseType = TRANSFER_APP_RESPONSE;
          break;
        }
        case UNSTAKE_APP_REQUEST: {
          responseType = UNSTAKE_APP_RESPONSE;
          break;
        }
        case CHANGE_PARAM_REQUEST: {
          responseType = CHANGE_PARAM_RESPONSE;
          break;
        }
        case DAO_TRANSFER_REQUEST: {
          responseType = DAO_TRANSFER_RESPONSE;
          break;
        }
        default: {
          throw new Error("Invalid request type");
        }
      }
      if (error.code === OperationRejected.code) {
        data = {
          rejected: true,
          hash: null,
          protocol: null,
        };
        errorToReturn = null;
      }
      break;
    }
    case CONNECTION_REQUEST_MESSAGE: {
      responseType = CONNECTION_RESPONSE_MESSAGE;
      if (error.code === OperationRejected.code) {
        data = {
          accepted: false,
          session: null,
          protocol: null,
          addresses: null,
        };
        errorToReturn = null;
      }
      break;
    }
    case SWITCH_CHAIN_REQUEST: {
      if (error.code === OperationRejected.code) {
        data = null;
        errorToReturn = OperationRejected;
      }
      responseType = SWITCH_CHAIN_RESPONSE;
      break;
    }
    case PERSONAL_SIGN_REQUEST: {
      data = null;
      errorToReturn = OperationRejected;
      responseType = PERSONAL_SIGN_RESPONSE;
      break;
    }
    case SIGN_TYPED_DATA_REQUEST: {
      data = null;
      errorToReturn = OperationRejected;
      responseType = SIGN_TYPED_DATA_RESPONSE;
      break;
    }
  }

  const numberOfRequests = requestsLength - 1;

  const badgeText = numberOfRequests > 0 ? `${numberOfRequests}` : "";

  const res = {
    type: responseType,
    data,
    error: errorToReturn,
    requestId: request.requestId,
  } as UiResponsesToProxy;

  await Promise.all([
    browser.tabs.sendMessage(request.tabId, res),
    dispatch(
      removeExternalRequest({
        origin: request.origin,
        type: request.type,
        protocol: request.protocol,
      })
    ),
    browser.action.setBadgeText({
      text: badgeText,
    }),
  ])
    .then(() => {
      if (closeWindow && !numberOfRequests) {
        closeCurrentWindow().catch();
      }
    })
    .catch();
};

type Message =
  | ((onClickClose: () => void) => SnackbarMessage)
  | SnackbarMessage
  | { title: string; content: string };

export const enqueueSnackbar = <V extends VariantType>(
  options: OptionsWithExtraProps<V> & {
    message?: Message;
  } & object
): SnackbarKey => {
  let snackbarKey: SnackbarKey;

  const onClickClose = () => {
    if (snackbarKey) {
      closeSnackbar(snackbarKey);
    }
  };

  let message: React.ReactNode;

  if (typeof options.message === "function") {
    message = options.message(onClickClose);
  } else if (
    typeof options.message === "object" &&
    "title" in options.message
  ) {
    message = (
      <Stack className={"title-with-content"}>
        <Typography color={themeColors.bgLightGray} fontWeight={500}>
          {options.message.title}
        </Typography>
        <Typography
          color={themeColors.light_gray2}
          whiteSpace={"pre-line"}
          marginBottom={3.8}
        >
          {options.message.content}
        </Typography>
      </Stack>
    );
  } else {
    message = options.message;
  }

  snackbarKey = enqueueSnackbarNotistack({
    ...options,
    message: (
      <Stack
        direction={"row"}
        alignItems={"center"}
        justifyContent={"space-between"}
        marginX={0.9}
        spacing={1}
        width={1}
      >
        {typeof options.message === "object" && "title" in options.message ? (
          message
        ) : (
          <Typography
            fontWeight={500}
            color={themeColors.bgLightGray}
            flexGrow={1}
          >
            {message}
          </Typography>
        )}

        <Button
          sx={{
            width: 40,
            height: 27,
            minWidth: 40,
            borderRadius: "6px",
            backgroundColor: themeColors.white,
            boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.08)",
            "&:hover": {
              backgroundColor: themeColors.light_gray,
            },
          }}
          className={"okay-button"}
          onClick={onClickClose}
        >
          Ok
        </Button>
      </Stack>
    ),
  });

  return snackbarKey;
};

export const enqueueErrorSnackbar = <V extends VariantType>(
  options: OptionsWithExtraProps<V> & {
    message?: Message;
    onRetry: () => void;
  } & object
): SnackbarKey => {
  let snackbarKey: SnackbarKey;

  const onClickClose = () => {
    if (snackbarKey) {
      options.onRetry();
      closeSnackbar(snackbarKey);
    }
  };

  let message: React.ReactNode;

  if (typeof options.message === "function") {
    message = options.message(onClickClose);
  } else if (
    typeof options.message === "object" &&
    "title" in options.message
  ) {
    message = (
      <Stack className={"title-with-content"}>
        <Typography color={themeColors.bgLightGray} fontWeight={500}>
          {options.message.title}
        </Typography>
        <Typography
          color={themeColors.light_gray2}
          whiteSpace={"pre-line"}
          marginBottom={3.8}
        >
          {options.message.content}
        </Typography>
      </Stack>
    );
  } else {
    message = options.message;
  }
  snackbarKey = enqueueSnackbarNotistack({
    autoHideDuration: 4000,
    ...options,
    variant: options.variant || "error",
    message: (
      <Stack
        direction={"row"}
        alignItems={"center"}
        justifyContent={"space-between"}
        marginX={0.9}
        spacing={1}
        width={1}
      >
        {typeof options.message === "object" && "title" in options.message ? (
          message
        ) : (
          <Typography
            fontWeight={500}
            color={themeColors.bgLightGray}
            flexGrow={1}
          >
            {message}
          </Typography>
        )}
        <Button
          sx={{
            width: 60,
            height: 27,
            minWidth: 60,
            borderRadius: "6px",
            backgroundColor: themeColors.white,
            boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.08)",
            "&:hover": {
              backgroundColor: themeColors.light_gray,
            },
          }}
          className={"retry-button"}
          onClick={onClickClose}
        >
          Retry
        </Button>
      </Stack>
    ),
  });

  return snackbarKey;
};

export const wrongPasswordSnackbar = () =>
  enqueueSnackbar({
    variant: "error",
    message: "Wrong password",
    key: "wrong-password",
  });

export const roundAndSeparate = (
  value: number,
  decimalPlaces = 4,
  defaultValue: string | number = "-"
) => {
  return value
    ? parseFloat(value.toFixed(decimalPlaces)).toLocaleString(undefined, {
        maximumFractionDigits: decimalPlaces,
      })
    : (defaultValue as string);
};

export const returnNumWithTwoDecimals = (
  value: number,
  defaultValue: string | number = "-"
) => {
  if (!value) {
    return defaultValue;
  }

  let decimals = 1,
    valueToReturn = roundAndSeparate(value, decimals, defaultValue);

  while (
    (valueToReturn === defaultValue || valueToReturn === "0") &&
    decimals <= 98
  ) {
    decimals++;
    valueToReturn = roundAndSeparate(value, decimals, defaultValue);
  }

  return roundAndSeparate(value, decimals + 1, defaultValue);
};

export const getTruncatedText = (text: string, charactersPerSide = 4) => {
  const firstCharacters = text?.substring(0, charactersPerSide);
  const lastCharacters = text?.substring(text?.length - charactersPerSide);

  return `${firstCharacters}...${lastCharacters}`;
};

export const secsToText = (secs: number) => {
  const secsInHour = 3600;

  function pad(a, b = 2) {
    return (1e15 + a + "").slice(-b);
  }

  if (secs > secsInHour) {
    const hours = Math.floor(secs / secsInHour);
    secs -= hours * secsInHour;
    const minutes = Math.floor(secs / 60);
    secs -= minutes * 60;
    const seconds = Math.floor(secs);

    return `${hours}:${pad(minutes)}:${pad(seconds)}`;
  } else if (secs > 60) {
    const minutes = Math.floor(secs / 60);
    secs -= minutes * 60;
    const seconds = Math.floor(secs);

    return `${minutes}:${pad(seconds)}`;
  } else {
    const seconds = Math.floor(secs);
    return `0:${pad(seconds)}`;
  }
};

export const readFile = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      const fr = new FileReader();

      fr.onload = (event) => {
        resolve(event.target.result.toString());
      };

      fr.readAsText(file);
    } catch (e) {
      reject(e);
    }
  });
};
