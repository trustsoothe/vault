import type { AppRequests, UiResponsesToProxy } from "../types/communications";
import type { SupportedProtocols } from "@soothe/vault";
import React from "react";
import Stack from "@mui/material/Stack";
import browser from "webextension-polyfill";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
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
import { useAppDispatch } from "../hooks/redux";
import {
  CONNECTION_REQUEST_MESSAGE,
  CONNECTION_RESPONSE_MESSAGE,
  PERSONAL_SIGN_RESPONSE,
  SIGN_TYPED_DATA_RESPONSE,
  SWITCH_CHAIN_REQUEST,
  SWITCH_CHAIN_RESPONSE,
  TRANSFER_REQUEST,
  TRANSFER_RESPONSE,
} from "../constants/communication";
import CloseIcon from "../assets/img/gray_close_icon.svg";

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
    | typeof PERSONAL_SIGN_RESPONSE;
  let data: UiResponsesToProxy["data"] = null;
  let errorToReturn: UiResponsesToProxy["error"] = null;

  if (error.code !== OperationRejected.code) {
    errorToReturn = error;
  }

  switch (request.type) {
    case TRANSFER_REQUEST: {
      responseType = TRANSFER_RESPONSE;
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
  | SnackbarMessage;

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

  const message =
    typeof options.message === "function"
      ? options.message(onClickClose)
      : options.message;

  snackbarKey = enqueueSnackbarNotistack({
    ...options,
    message: (
      <Stack
        direction={"row"}
        alignItems={"center"}
        justifyContent={"space-between"}
        marginLeft={1}
        marginRight={0.5}
        spacing={1}
      >
        <Typography
          fontWeight={500}
          fontSize={13}
          color={"#152A48"}
          width={280}
          lineHeight={"18px"}
        >
          {message}
        </Typography>
        <IconButton onClick={onClickClose}>
          <CloseIcon />
        </IconButton>
      </Stack>
    ),
  });

  return snackbarKey;
};

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
