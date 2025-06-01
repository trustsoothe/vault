import type { ExternalTransferState } from "./TransactionRequest";
import type { TEthTransferBody } from "../../controllers/communication/Proxy";
import { fromWei } from "web3-utils";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Outlet, useNavigate } from "react-router-dom";
import React, { useEffect, useMemo, useState } from "react";
import { externalRequestsSelector } from "../../redux/selectors/session";
import { closeCurrentWindow } from "../../utils/ui";
import { HeaderContainer } from "../Header/Header";
import { useAppSelector } from "../hooks/redux";
import BackButton from "../Header/BackButton";
import { WIDTH } from "../../constants/ui";
import {
  BULK_PERSONAL_SIGN_REQUEST,
  BULK_SIGN_TRANSACTION_REQUEST,
  CHANGE_PARAM_REQUEST,
  CONNECTION_REQUEST_MESSAGE,
  DAO_TRANSFER_REQUEST,
  PERSONAL_SIGN_REQUEST,
  PUBLIC_KEY_REQUEST,
  SIGN_TYPED_DATA_REQUEST,
  STAKE_APP_REQUEST,
  STAKE_NODE_REQUEST,
  SWITCH_CHAIN_REQUEST,
  TRANSFER_APP_REQUEST,
  TRANSFER_REQUEST,
  UNJAIL_NODE_REQUEST,
  UNSTAKE_APP_REQUEST,
  UNSTAKE_NODE_REQUEST,
  UPGRADE_REQUEST,
} from "../../constants/communication";
import RequestHeader from "./Header";
import {
  BULK_PERSONAL_SIGN_PAGE,
  CHANGE_SELECTED_CHAIN_PAGE,
  PERSONAL_SIGN_PAGE,
  POKT_TRANSACTION_PAGE,
  REQUEST_CONNECTION_PAGE,
  SIGN_TRANSACTIONS_PAGE,
  SIGN_TYPED_DATA_PAGE,
  TRANSFER_PAGE,
} from "../../constants/routes";
import AppToBackground from "../../controllers/communication/AppToBackground";
import { SupportedProtocols } from "@soothe/vault";

export default function Handler() {
  const navigate = useNavigate();
  const externalRequests = useAppSelector(externalRequestsSelector);
  const [idOfSelectedRequest, setIdOfSelectedRequest] = useState(0);

  const switchNavigation = () => {
    if (!externalRequests.length) {
      closeCurrentWindow().catch();
    } else {
      const currentRequest =
        externalRequests[
          idOfSelectedRequest >= externalRequests.length + 1
            ? 0
            : idOfSelectedRequest
        ];

      switch (currentRequest.type) {
        case PUBLIC_KEY_REQUEST: {
          AppToBackground.getPublicKey({
            request: currentRequest,
          }).finally(() => {
            closeCurrentWindow().catch();
          });
          break;
        }
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
        case BULK_PERSONAL_SIGN_REQUEST: {
          navigate(BULK_PERSONAL_SIGN_PAGE, { state: currentRequest });
          break;
        }
        case STAKE_NODE_REQUEST:
        case UNSTAKE_NODE_REQUEST:
        case UNJAIL_NODE_REQUEST:
        case STAKE_APP_REQUEST:
        case TRANSFER_APP_REQUEST:
        case UNSTAKE_APP_REQUEST:
        case CHANGE_PARAM_REQUEST:
        case DAO_TRANSFER_REQUEST:
        case UPGRADE_REQUEST: {
          navigate(POKT_TRANSACTION_PAGE, { state: currentRequest });
          break;
        }
        case TRANSFER_REQUEST: {
          const dataFromRequest = currentRequest.transferData;

          let transferDataState: ExternalTransferState["transferData"];

          if ("amount" in dataFromRequest) {
            transferDataState = {
              fromAddress: dataFromRequest.from,
              amount: (Number(dataFromRequest.amount || 0) / 1e6).toString(),
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
        case BULK_SIGN_TRANSACTION_REQUEST: {
          navigate(SIGN_TRANSACTIONS_PAGE, { state: currentRequest });
          break;
        }
      }
    }
  };

  useEffect(() => {
    switchNavigation();
  }, [idOfSelectedRequest]);

  useEffect(() => {
    if (externalRequests.length) {
      if (idOfSelectedRequest === externalRequests.length) {
        setIdOfSelectedRequest(externalRequests.length - 1);
      } else {
        switchNavigation();
      }
    } else {
      closeCurrentWindow().catch(console.error);
    }
  }, [externalRequests.length]);

  const currentRequest = useMemo(() => {
    if (!externalRequests.length) {
      return null;
    }

    return externalRequests[
      idOfSelectedRequest >= externalRequests.length + 1
        ? 0
        : idOfSelectedRequest
    ];
  }, [externalRequests, idOfSelectedRequest]);

  if (!currentRequest) {
    return null;
  }

  let address: string, chainId: string;

  switch (currentRequest.type) {
    case TRANSFER_REQUEST: {
      address = currentRequest.transferData.from;
      chainId = currentRequest.transferData.chainId;
      break;
    }
    case STAKE_NODE_REQUEST:
    case UNSTAKE_NODE_REQUEST:
    case UNJAIL_NODE_REQUEST:
    case STAKE_APP_REQUEST:
    case TRANSFER_APP_REQUEST:
    case UNSTAKE_APP_REQUEST:
    case CHANGE_PARAM_REQUEST:
    case DAO_TRANSFER_REQUEST:
    case UPGRADE_REQUEST: {
      address = currentRequest.transactionData.address;
      chainId = currentRequest.transactionData.chainId;
      break;
    }
    case BULK_PERSONAL_SIGN_REQUEST:
    case PERSONAL_SIGN_REQUEST:
    case SIGN_TYPED_DATA_REQUEST: {
      address = currentRequest.address;
      break;
    }
    case BULK_SIGN_TRANSACTION_REQUEST: {
      const tx = currentRequest.data.transactions.at(0);

      if (tx.protocol === SupportedProtocols.Cosmos) {
        address = tx.address;
      } else if (tx.protocol === SupportedProtocols.Pocket) {
        address =
          "from" in tx.transaction
            ? tx.transaction.from
            : "address" in tx.transaction
            ? tx.transaction.address
            : undefined;
      }
    }
  }

  return (
    <Stack flexGrow={1} overflow={"hidden"} width={WIDTH}>
      {externalRequests.length > 1 && (
        <HeaderContainer justifyContent={"space-between"}>
          {idOfSelectedRequest !== 0 && (
            <BackButton
              onClick={() => setIdOfSelectedRequest((prev) => prev - 1)}
            />
          )}
          <Stack
            flexGrow={1}
            paddingLeft={idOfSelectedRequest === 0 ? 3.3 : undefined}
            paddingRight={
              idOfSelectedRequest === externalRequests.length - 1
                ? 3.3
                : undefined
            }
            alignItems={"center"}
          >
            <Typography variant={"subtitle2"}>
              {idOfSelectedRequest >= externalRequests.length + 1
                ? 0
                : idOfSelectedRequest + 1}{" "}
              of {externalRequests.length}
            </Typography>
            <Typography fontSize={11}>
              Requests waiting to be acknowledged.
            </Typography>
          </Stack>
          {idOfSelectedRequest < externalRequests.length - 1 && (
            <BackButton
              flip={true}
              onClick={() => setIdOfSelectedRequest((prev) => prev + 1)}
            />
          )}
        </HeaderContainer>
      )}
      <RequestHeader
        accountAddress={address}
        protocol={currentRequest.protocol}
        chainId={chainId}
      />
      <Outlet />
    </Stack>
  );
}
