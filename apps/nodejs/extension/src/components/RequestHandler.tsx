import type { RootState } from "../redux/store";
import { connect } from "react-redux";
import Stack from "@mui/material/Stack";
import { Outlet, useNavigate } from "react-router-dom";
import React, { useEffect, useMemo } from "react";
import { closeCurrentWindow } from "../utils/ui";
import {
  CONNECTION_REQUEST_MESSAGE,
  NEW_ACCOUNT_REQUEST,
  TRANSFER_REQUEST,
} from "../constants/communication";
import {
  CREATE_ACCOUNT_PAGE,
  REQUEST_CONNECTION_PAGE,
  TRANSFER_PAGE,
} from "../constants/routes";
import SootheLogoHeader from "./common/SootheLogoHeader";

interface RequestHandlerProps {
  externalRequests: RootState["app"]["externalRequests"];
  isUnlocked: Boolean;
}

const RequestHandler: React.FC<RequestHandlerProps> = ({
  externalRequests,
}) => {
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

  if (!currentRequest) {
    return null;
  }

  return (
    <Stack flexGrow={1}>
      <SootheLogoHeader compact={true} />
      <Outlet />
    </Stack>
  );
};

const mapStateToProps = (state: RootState) => {
  return {
    externalRequests: state.app.externalRequests,
    isUnlocked: state.vault.isUnlockedStatus === "yes",
  };
};

export default connect(mapStateToProps)(RequestHandler);
