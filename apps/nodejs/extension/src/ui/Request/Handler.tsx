import type { ExternalTransferState } from "../../components/Transfer";
import type { TEthTransferBody } from "../../controllers/communication/Proxy";
import { fromWei } from "web3-utils";
import Stack from "@mui/material/Stack";
import React, { useEffect, useMemo } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { externalRequestsSelector } from "../../redux/selectors/session";
import { TransferType } from "../../contexts/TransferContext";
import { closeCurrentWindow } from "../../utils/ui";
import { useAppSelector } from "../../hooks/redux";
import { WIDTH } from "../../constants/ui";
import {
  CONNECTION_REQUEST_MESSAGE,
  PERSONAL_SIGN_REQUEST,
  SIGN_TYPED_DATA_REQUEST,
  SWITCH_CHAIN_REQUEST,
  TRANSFER_REQUEST,
} from "../../constants/communication";
import RequestHeader from "./Header";
import {
  CHANGE_SELECTED_CHAIN_PAGE,
  PERSONAL_SIGN_PAGE,
  REQUEST_CONNECTION_PAGE,
  SIGN_TYPED_DATA_PAGE,
  TRANSFER_PAGE,
} from "../../constants/routes";

export default function Handler() {
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
        case SWITCH_CHAIN_REQUEST: {
          navigate(CHANGE_SELECTED_CHAIN_PAGE, { state: currentRequest });
          break;
        }
        case SIGN_TYPED_DATA_REQUEST: {
          navigate(SIGN_TYPED_DATA_PAGE, { state: currentRequest });
          break;
        }
        case PERSONAL_SIGN_REQUEST: {
          navigate(PERSONAL_SIGN_PAGE, { state: currentRequest });
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
                ? fromWei(transferData.value, "ether").toString()
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

  // todo: handle index of request selected
  const currentRequest = useMemo(() => {
    if (!externalRequests.length) {
      return null;
    }

    return externalRequests[0];
  }, [externalRequests]);

  if (!currentRequest) {
    return null;
  }

  let address: string;

  switch (currentRequest.type) {
    case TRANSFER_REQUEST: {
      address = currentRequest.transferData.from;
      break;
    }
    case PERSONAL_SIGN_REQUEST:
    case SIGN_TYPED_DATA_REQUEST: {
      address = currentRequest.address;
      break;
    }
  }

  return (
    <Stack flexGrow={1} overflow={"hidden"} width={WIDTH}>
      <RequestHeader
        accountAddress={address}
        protocol={currentRequest.protocol}
      />
      <Outlet />
    </Stack>
  );
}
