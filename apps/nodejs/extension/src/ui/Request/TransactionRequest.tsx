import React from "react";
import Stack from "@mui/material/Stack";
import { useLocation } from "react-router-dom";
import {
  EthereumNetworkFee,
  PocketNetworkFee,
  SupportedProtocols,
  SupportedTransferDestinations,
  SupportedTransferOrigins,
} from "@soothe/vault";
import { themeColors } from "../theme";
import RequestInfo from "./RequestInfo";
import BaseTransaction, {
  TransactionFormValues,
} from "../Transaction/BaseTransaction";
import { useAppSelector } from "../hooks/redux";
import BaseSummary from "../Transaction/BaseSummary";
import EthFeeSelect from "../Transaction/EthFeeSelect";
import { networksSelector } from "../../redux/selectors/network";
import { accountsSelector } from "../../redux/selectors/account";
import VaultPasswordInput from "../Transaction/VaultPasswordInput";
import { SendTransactionParams } from "../../redux/slices/vault/account";
import AppToBackground from "../../controllers/communication/AppToBackground";
import type { IAsset } from "../../redux/slices/app";

export interface ExternalTransferData {
  amount: string;
  fromAddress?: string;
  toAddress: string;
  memo?: string;
  data?: string;
  gasLimit?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
}

export interface ExternalTransferState {
  asset?: IAsset;
  transferData: ExternalTransferData;
  requestInfo?: {
    origin: string;
    tabId: number;
    sessionId: string;
    chainId: string;
    protocol: SupportedProtocols;
    requestId: string;
  };
}

export default function TransactionRequest() {
  const location = useLocation();
  const networks = useAppSelector(networksSelector);
  const accounts = useAppSelector(accountsSelector);

  const { transferData, requestInfo: request }: ExternalTransferState =
    location.state;

  const isEth = request.protocol === SupportedProtocols.Ethereum;

  const getFeeOptions = (_: TransactionFormValues) => {
    return {
      data: transferData.data,
      gasLimit: transferData.gasLimit
        ? parseInt(transferData.gasLimit.substring(2), 16)
        : undefined,
      maxFeePerGas: transferData.maxFeePerGas,
      maxPriorityFeePerGas: transferData.maxPriorityFeePerGas,
    };
  };

  const getTransaction = (
    data: TransactionFormValues
  ): SendTransactionParams => {
    const accountId = accounts.find(
      (item) =>
        item.address === data.fromAddress && item.protocol === data.protocol
    )?.id;

    const base: SendTransactionParams = {
      from: {
        type: SupportedTransferOrigins.VaultAccountId,
        passphrase: data.vaultPassword || "",
        value: accountId,
      },
      network: {
        protocol: data.protocol,
        chainID: data.chainId,
      },
      to: {
        type: SupportedTransferDestinations.RawAddress,
        value: data.recipientAddress,
      },
      amount: Number(data.amount),
      transactionParams: {},
    };

    if (isEth) {
      const feeInfo = (data.fee as EthereumNetworkFee)[data.txSpeed];
      const network = networks.find(
        (network) =>
          network.protocol === data.protocol && network.chainId === data.chainId
      );
      return {
        ...base,
        amount: Number(data.amount || "0") * 10 ** network.decimals,
        isRawTransaction: true,
        transactionParams: {
          maxFeePerGas: feeInfo.suggestedMaxFeePerGas,
          maxPriorityFeePerGas: feeInfo.suggestedMaxPriorityFeePerGas,
          gasLimit: (data.fee as EthereumNetworkFee).estimatedGas,
          data: transferData.data,
        },
        metadata: {
          amountToSave: Number(data.amount || "0"),
          requestedBy: request.origin,
          maxFeeAmount: Number(feeInfo.amount),
        },
      };
    } else {
      return {
        ...base,
        transactionParams: {
          fee: (data.fee as PocketNetworkFee).value,
          memo: data.memo,
        },
        metadata: {
          requestedBy: request.origin,
        },
      };
    }
  };

  return (
    <Stack flexGrow={1}>
      <RequestInfo
        title={"Transaction Request"}
        description={"Only send transactions you authorize."}
        origin={request.origin}
      />
      <Stack
        flexGrow={1}
        minHeight={0}
        overflow={"auto"}
        flexBasis={"1px"}
        bgcolor={themeColors.white}
      >
        <BaseTransaction
          protocol={request.protocol}
          chainId={request.chainId}
          fromAddress={transferData.fromAddress}
          getTransaction={getTransaction}
          getFeeOptions={isEth ? getFeeOptions : undefined}
          defaultFormValue={{
            amount: transferData?.amount || "",
            memo: transferData.memo || undefined,
            recipientAddress: transferData?.toAddress || "",
            txSpeed: isEth
              ? transferData.gasLimit ||
                transferData.maxPriorityFeePerGas ||
                transferData.maxFeePerGas
                ? "site"
                : "medium"
              : undefined,
          }}
          onCancel={() => {
            AppToBackground.sendRequestToAnswerTransfer({
              transferData: null,
              request,
              rejected: true,
            });
          }}
          summary={
            <Stack padding={2} boxSizing={"border-box"} maxHeight={350}>
              <BaseSummary onlyShowAmount={isEth} hideNetworks={!isEth} />
              {isEth && <EthFeeSelect marginTop={1.6} />}
              <VaultPasswordInput />
            </Stack>
          }
          cancelLabel={"Reject"}
          request={request}
        />
      </Stack>
    </Stack>
  );
}
