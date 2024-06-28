import React from "react";
import {
  EthereumNetworkFee,
  SupportedProtocols,
  SupportedTransferDestinations,
  SupportedTransferOrigins,
  WPOKTBridge,
} from "@poktscan/vault";
import Summary from "./Summary";
import Submitted from "./Submitted";
import {
  selectedChainSelector,
  selectedProtocolSelector,
} from "../../redux/selectors/network";
import {
  accountsSelector,
  selectedAccountAddressSelector,
} from "../../redux/selectors/account";
import SendFormEth from "./SendFormEth";
import { useAppSelector } from "../../hooks/redux";
import useSelectedAsset from "../Home/hooks/useSelectedAsset";
import { SendTransactionParams } from "../../redux/slices/vault/account";
import BaseTransaction, { TransactionFormValues } from "./BaseTransaction";

interface SendEthProps {
  onCancel: () => void;
  isUnwrapping?: boolean;
}

export default function SendEth({ onCancel, isUnwrapping }: SendEthProps) {
  const asset = useSelectedAsset();
  const selectedChain = useAppSelector(selectedChainSelector);
  const accounts = useAppSelector(accountsSelector);
  const selectedProtocol = useAppSelector(selectedProtocolSelector);
  const selectedAccountAddress = useAppSelector(selectedAccountAddressSelector);

  const getFeeOptions = (data: TransactionFormValues) => {
    let burnTx: ReturnType<typeof WPOKTBridge.createBurnTransaction>;

    if (isUnwrapping && data.recipientAddress) {
      burnTx = WPOKTBridge.createBurnTransaction({
        amount: (Number(data.amount || "0") * 10 ** asset.decimals).toString(),
        from: data.fromAddress,
        to: data.recipientAddress,
        contractAddress: asset.contractAddress,
      });
    }

    return {
      asset: asset
        ? {
            protocol: asset.protocol,
            chainID: asset.chainId,
            contractAddress: asset.contractAddress,
            decimals: asset.decimals,
          }
        : undefined,
      ...(burnTx && {
        to: asset.contractAddress,
        data: burnTx.data,
        from: burnTx.from,
      }),
    };
  };

  const getTransaction = (
    data: TransactionFormValues
  ): SendTransactionParams => {
    let burnTx: ReturnType<typeof WPOKTBridge.createBurnTransaction>;

    if (isUnwrapping) {
      burnTx = WPOKTBridge.createBurnTransaction({
        amount: (Number(data.amount || "0") * 10 ** asset.decimals).toString(),
        from: data.fromAddress,
        to: data.recipientAddress,
        contractAddress: asset.contractAddress,
      });
    }

    const accountId = accounts.find(
      (item) =>
        item.address === data.fromAddress && item.protocol === data.protocol
    )?.id;

    const feeInfo = (data.fee as EthereumNetworkFee)[data.txSpeed];

    return {
      from: {
        type: SupportedTransferOrigins.VaultAccountId,
        passphrase: data.vaultPassword || "",
        value: accountId,
      },
      asset:
        asset && !isUnwrapping
          ? {
              protocol: data.protocol,
              chainID: data.chainId,
              contractAddress: asset.contractAddress,
              decimals: asset.decimals,
            }
          : undefined,
      network: {
        protocol: data.protocol,
        chainID: data.chainId,
      },
      to: {
        type: SupportedTransferDestinations.RawAddress,
        value: isUnwrapping ? asset.contractAddress : data.recipientAddress,
      },
      amount: isUnwrapping ? 0 : Number(data.amount),
      transactionParams: {
        maxFeePerGas: feeInfo.suggestedMaxFeePerGas,
        maxPriorityFeePerGas: feeInfo.suggestedMaxPriorityFeePerGas,
        gasLimit: (data.fee as EthereumNetworkFee).estimatedGas,
        data: burnTx?.data,
      },
      isRawTransaction: isUnwrapping,
      metadata: isUnwrapping
        ? {
            maxFeeAmount: Number(feeInfo.amount),
            swapTo: {
              address: data.recipientAddress,
              network: {
                protocol: SupportedProtocols.Pocket,
                chainId: data.chainId === "1" ? "mainnet" : "testnet",
              },
            },
          }
        : { maxFeeAmount: Number(feeInfo.amount) },
    };
  };

  return (
    <BaseTransaction
      chainId={selectedChain}
      protocol={selectedProtocol}
      fromAddress={selectedAccountAddress}
      getTransaction={getTransaction}
      defaultFormValue={{
        txSpeed: "medium",
        recipientProtocol: isUnwrapping ? SupportedProtocols.Pocket : undefined,
      }}
      getFeeOptions={getFeeOptions}
      form={<SendFormEth isUnwrapping={isUnwrapping} />}
      summary={<Summary isSwapping={isUnwrapping} />}
      success={<Submitted isSwapping={isUnwrapping} />}
      onCancel={onCancel}
      onDone={onCancel}
    />
  );
}
