import { RootState } from "../redux/store";
import { connect } from "react-redux";
import React, { useCallback, useEffect, useMemo } from "react";
import browser from "webextension-polyfill";
import {
  CONNECTION_REQUEST_MESSAGE,
  NEW_ACCOUNT_REQUEST,
  TRANSFER_REQUEST,
} from "../constants/communication";
import Request from "./Session/Request";
import CreateNew from "./Account/CreateNew";
import Transfer from "./Transfer";

interface RequestHandlerProps {
  externalRequests: RootState["app"]["externalRequests"];
}

const RequestHandler: React.FC<RequestHandlerProps> = ({
  externalRequests,
}) => {
  const closeCurrentWindow = useCallback(() => {
    browser.windows
      .getCurrent()
      .then((window) => browser.windows.remove(window.id));
  }, []);

  const updateBadgeText = useCallback(() => {
    const length = externalRequests.length;
    const badgeText = length - 1 ? `${length - 1}` : "";

    browser.action
      .setBadgeText({
        text: badgeText,
      })
      .catch();
  }, [externalRequests]);

  useEffect(() => {
    if (!externalRequests.length) {
      closeCurrentWindow();
    } else {
      // updateBadgeText();
    }
  }, [externalRequests.length]);

  const currentRequest = useMemo(() => {
    if (!externalRequests.length) {
      return null;
    }

    return externalRequests[0];
  }, [externalRequests]);

  if (!currentRequest) {
    return null;
  }

  switch (currentRequest.type) {
    case CONNECTION_REQUEST_MESSAGE: {
      return <Request currentRequest={currentRequest} />;
    }
    case NEW_ACCOUNT_REQUEST: {
      return <CreateNew currentRequest={currentRequest} />;
    }
    case TRANSFER_REQUEST: {
      return <Transfer requesterInfo={currentRequest} />;
    }
    default:
      return null;
  }
};

const mapStateToProps = (state: RootState) => {
  return {
    externalRequests: state.app.externalRequests,
  };
};

export default connect(mapStateToProps)(RequestHandler);
