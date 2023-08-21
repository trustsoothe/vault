import type { RootState } from "../redux/store";
import type {
  ConnectionResponseFromBack,
  NewAccountResponseFromBack,
  TransferResponseFromBack,
} from "../types/communication";
import { connect } from "react-redux";
import Button from "@mui/material/Button";
import browser from "webextension-polyfill";
import { Outlet, useNavigate } from "react-router-dom";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  CONNECTION_REQUEST_MESSAGE,
  CONNECTION_RESPONSE_MESSAGE,
  NEW_ACCOUNT_REQUEST,
  NEW_ACCOUNT_RESPONSE,
  TRANSFER_REQUEST,
  TRANSFER_RESPONSE,
} from "../constants/communication";
import {
  CREATE_ACCOUNT_PAGE,
  REQUEST_CONNECTION_PAGE,
  TRANSFER_PAGE,
} from "../constants/routes";
import ToggleBlockSite from "./Session/ToggleBlockSite";
import { OriginBlocked, RequestTimeout } from "../errors/communication";
import { useAppDispatch } from "../hooks/redux";
import { removeExternalRequest, RequestsType } from "../redux/slices/app";

export const closeCurrentWindow = () =>
  browser.windows
    .getCurrent()
    .then((window) => browser.windows.remove(window.id));

export const removeRequestWithRes = async (
  request: RequestsType,
  error: typeof OriginBlocked | typeof RequestTimeout,
  dispatch: ReturnType<typeof useAppDispatch>,
  requestsLength: number
) => {
  let responseType:
    | typeof TRANSFER_RESPONSE
    | typeof CONNECTION_RESPONSE_MESSAGE
    | typeof NEW_ACCOUNT_RESPONSE;

  switch (request.type) {
    case TRANSFER_REQUEST: {
      responseType = TRANSFER_RESPONSE;
      break;
    }
    case CONNECTION_REQUEST_MESSAGE: {
      responseType = CONNECTION_RESPONSE_MESSAGE;
      break;
    }
    case NEW_ACCOUNT_REQUEST: {
      responseType = NEW_ACCOUNT_RESPONSE;
      break;
    }
  }

  const numberOfRequests = requestsLength - 1;

  const badgeText = numberOfRequests > 0 ? `${numberOfRequests}` : "";

  const res:
    | ConnectionResponseFromBack
    | NewAccountResponseFromBack
    | TransferResponseFromBack = {
    type: responseType,
    data: null,
    error: error,
  };

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
  ]).catch();
};

interface RequestHandlerProps {
  externalRequests: RootState["app"]["externalRequests"];
  isUnlocked: Boolean;
}

const RequestHandler: React.FC<RequestHandlerProps> = ({
  externalRequests,
  isUnlocked,
}) => {
  const dispatch = useAppDispatch();
  const [blockOriginRequest, setBlockOriginRequest] = useState<boolean>(false);

  const navigate = useNavigate();

  useEffect(() => {
    if (!externalRequests.length) {
      closeCurrentWindow().catch();
    } else {
      const currentRequest = externalRequests[0];

      switch (currentRequest.type) {
        case CONNECTION_REQUEST_MESSAGE: {
          navigate(REQUEST_CONNECTION_PAGE, { state: currentRequest });
          break;
        }
        case NEW_ACCOUNT_REQUEST: {
          navigate(CREATE_ACCOUNT_PAGE, { state: currentRequest });
          break;
        }
        case TRANSFER_REQUEST: {
          navigate(TRANSFER_PAGE, { state: currentRequest });
          break;
        }
      }
    }
  }, [externalRequests.length]);

  const currentRequest = useMemo(() => {
    if (!externalRequests.length) {
      return null;
    }

    return externalRequests[0];
  }, [externalRequests]);

  useEffect(() => {
    setBlockOriginRequest(false);
  }, [currentRequest]);

  const toggleBlockOriginRequest = useCallback(() => {
    setBlockOriginRequest((prevState) => !prevState);
  }, []);

  const onBlockedSite = useCallback(() => {
    if (currentRequest) {
      removeRequestWithRes(
        currentRequest,
        OriginBlocked,
        dispatch,
        externalRequests.length
      ).catch();
    }
  }, [currentRequest, externalRequests.length, dispatch]);

  if (!currentRequest) {
    return null;
  }

  if (blockOriginRequest && isUnlocked) {
    return (
      <ToggleBlockSite
        site={currentRequest.origin}
        sessionId={
          "sessionId" in currentRequest ? currentRequest.sessionId : undefined
        }
        onBlocked={onBlockedSite}
        onClose={toggleBlockOriginRequest}
      />
    );
  }

  return (
    <>
      <Button
        sx={{
          position: "absolute",
          textTransform: "none",
          textDecoration: "underline",
          fontSize: 14,
          right: "5px",
          top: "0px",
        }}
        onClick={toggleBlockOriginRequest}
      >
        Block this site
      </Button>
      <Outlet />
    </>
  );
};

const mapStateToProps = (state: RootState) => {
  return {
    externalRequests: state.app.externalRequests,
    isUnlocked: state.vault.isUnlockedStatus === "yes",
  };
};

export default connect(mapStateToProps)(RequestHandler);
