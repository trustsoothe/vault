import { RootState } from "../redux/store";
import { connect } from "react-redux";
import React, { useCallback, useEffect, useMemo } from "react";
import browser from "webextension-polyfill";
import {
  CONNECTION_REQUEST_MESSAGE,
  NEW_ACCOUNT_REQUEST,
  TRANSFER_REQUEST,
} from "../constants/communication";
import { Outlet, useNavigate } from "react-router-dom";
import {
  CREATE_ACCOUNT_PAGE,
  REQUEST_CONNECTION_PAGE,
  TRANSFER_PAGE,
} from "../constants/routes";

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

  const navigate = useNavigate();

  useEffect(() => {
    if (!externalRequests.length) {
      closeCurrentWindow();
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

  if (!currentRequest) {
    return null;
  }

  return <Outlet />;
};

const mapStateToProps = (state: RootState) => {
  return {
    externalRequests: state.app.externalRequests,
  };
};

export default connect(mapStateToProps)(RequestHandler);
