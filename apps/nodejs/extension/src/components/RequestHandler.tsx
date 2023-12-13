import type { TEthTransferBody } from "../controllers/communication/Proxy";
import type { ExternalTransferState } from "./Transfer";
import { fromWei } from "web3-utils";
import Stack from "@mui/material/Stack";
import { Outlet, useNavigate } from "react-router-dom";
import React, { useEffect, useMemo } from "react";
import { closeCurrentWindow } from "../utils/ui";
import {
  CONNECTION_REQUEST_MESSAGE,
  NEW_ACCOUNT_REQUEST,
  SWITCH_CHAIN_REQUEST,
  TRANSFER_REQUEST,
} from "../constants/communication";
import {
  CHANGE_SELECTED_CHAIN_PAGE,
  CREATE_ACCOUNT_PAGE,
  REQUEST_CONNECTION_PAGE,
  TRANSFER_PAGE,
} from "../constants/routes";
import SootheLogoHeader from "./common/SootheLogoHeader";
import { useAppSelector } from "../hooks/redux";
import { externalRequestsSelector } from "../redux/selectors/session";
import { TransferType } from "../contexts/TransferContext";
import RequestHeader from "./Transfer/RequestHeader";

const RequestHandler: React.FC = () => {
  const navigate = useNavigate();

  const externalRequests = useAppSelector(externalRequestsSelector);

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
        case SWITCH_CHAIN_REQUEST: {
          navigate(CHANGE_SELECTED_CHAIN_PAGE, { state: currentRequest });
          break;
        }
        case TRANSFER_REQUEST: {
          const dataFromRequest = currentRequest.transferData;

          let transferDataState: ExternalTransferState["transferData"];

          if ("amount" in dataFromRequest) {
            transferDataState = {
              fromAddress: dataFromRequest.from,
              amount: (Number(dataFromRequest.amount) / 1e6).toString(),
              toAddress: dataFromRequest.to,
              memo: dataFromRequest.memo,
            };
          } else {
            const transferData = dataFromRequest as TEthTransferBody;
            transferDataState = {
              fromAddress: transferData.from,
              toAddress: transferData.to,
              data: transferData.data,
              amount: transferData.value
                ? fromWei(transferData.value.substring(2), "ether").toString()
                : undefined,
              gasLimit: transferData.gas,
              maxFeePerGas: transferData.maxFeePerGas,
              maxPriorityFeePerGas: transferData.maxPriorityFeePerGas,
            };
          }

          const state: ExternalTransferState = {
            transferType: TransferType.normal,
            requestInfo: {
              protocol: currentRequest.protocol,
              sessionId: currentRequest.sessionId,
              origin: currentRequest.origin,
              tabId: currentRequest.tabId,
              chainId: dataFromRequest.chainId,
              requestId: currentRequest.requestId,
            },
            transferData: transferDataState,
          };

          navigate(TRANSFER_PAGE, {
            state: state,
          });

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

  const header =
    currentRequest.type === TRANSFER_REQUEST ? (
      <RequestHeader origin={currentRequest.origin} />
    ) : (
      <SootheLogoHeader compact={true} />
    );

  return (
    <Stack flexGrow={1}>
      {header}
      <Outlet />
    </Stack>
  );
};

export default RequestHandler;
