import type {
  ConnectionResponseFromBack,
  NewAccountResponseFromBack,
  TransferResponseFromBack,
} from "../types/communication";
import React from "react";
import Stack from "@mui/material/Stack";
import browser from "webextension-polyfill";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import {
  closeSnackbar,
  EnqueueSnackbar,
  enqueueSnackbar as enqueueSnackbarNotistack,
  SnackbarKey,
} from "notistack";
import { removeExternalRequest, RequestsType } from "../redux/slices/app";
import {
  OperationRejected,
  OriginBlocked,
  RequestTimeout,
} from "../errors/communication";
import { useAppDispatch } from "../hooks/redux";
import {
  CONNECTION_REQUEST_MESSAGE,
  CONNECTION_RESPONSE_MESSAGE,
  NEW_ACCOUNT_REQUEST,
  NEW_ACCOUNT_RESPONSE,
  TRANSFER_REQUEST,
  TRANSFER_RESPONSE,
} from "../constants/communication";
import CloseIcon from "../assets/img/gray_close_icon.svg";

export const closeCurrentWindow = () =>
  browser.windows
    .getCurrent()
    .then((window) => browser.windows.remove(window.id));

type RequestsFromBack =
  | ConnectionResponseFromBack
  | NewAccountResponseFromBack
  | TransferResponseFromBack;

export const removeRequestWithRes = async (
  request: RequestsType,
  error:
    | typeof OriginBlocked
    | typeof RequestTimeout
    | typeof OperationRejected,
  dispatch: ReturnType<typeof useAppDispatch>,
  requestsLength: number,
  closeWindow = false
) => {
  let responseType:
    | typeof TRANSFER_RESPONSE
    | typeof CONNECTION_RESPONSE_MESSAGE
    | typeof NEW_ACCOUNT_RESPONSE;
  let data: RequestsFromBack["data"] = null;
  let errorToReturn: RequestsFromBack["error"] = null;

  if (error.name !== OperationRejected.name) {
    errorToReturn = error;
  }

  switch (request.type) {
    case TRANSFER_REQUEST: {
      responseType = TRANSFER_RESPONSE;
      if (error.name === OperationRejected.name) {
        data = {
          rejected: true,
          hash: null,
          protocol: null,
        } as TransferResponseFromBack["data"];
        errorToReturn = null;
      }
      break;
    }
    case CONNECTION_REQUEST_MESSAGE: {
      responseType = CONNECTION_RESPONSE_MESSAGE;
      if (error.name === OperationRejected.name) {
        data = {
          accepted: false,
          session: null,
        } as ConnectionResponseFromBack["data"];
        errorToReturn = null;
      }
      break;
    }
    case NEW_ACCOUNT_REQUEST: {
      if (error.name === OperationRejected.name) {
        data = {
          rejected: true,
          address: null,
          protocol: null,
        } as NewAccountResponseFromBack["data"];
        errorToReturn = null;
      }
      responseType = NEW_ACCOUNT_RESPONSE;
      break;
    }
  }

  const numberOfRequests = requestsLength - 1;

  const badgeText = numberOfRequests > 0 ? `${numberOfRequests}` : "";

  const res = {
    type: responseType,
    data,
    error: errorToReturn,
  } as RequestsFromBack;

  await Promise.all([
    browser.tabs.sendMessage(request.tabId, res),
    dispatch(
      removeExternalRequest({
        origin: request.origin,
        type: request.type,
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

export const enqueueSnackbar: EnqueueSnackbar = (options) => {
  let snackbarKey: SnackbarKey;

  const onClickClose = () => {
    if (snackbarKey) {
      closeSnackbar(snackbarKey);
    }
  };

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
        >
          {options.message}
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
