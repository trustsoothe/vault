import React from "react";
import {
  CosmosTransactionTypes,
  SupportedProtocols,
  SupportedTransferDestinations,
  SupportedTransferOrigins,
  CosmosFeeRequestOption,
} from "@soothe/vault";
import Summary from "./Summary";
import Submitted from "./Submitted";
import {accountsSelector, selectedAccountAddressSelector,} from "../../redux/selectors/account";
import {selectedChainSelector, selectedNetworkSelector, selectedProtocolSelector,} from "../../redux/selectors/network";
import BaseTransaction, {TransactionFormValues} from "./BaseTransaction";
import {useAppSelector} from "../hooks/redux";
import SendFormPocket from "./SendFormPocket";

interface SendPoktProps {
  onCancel: () => void;
}

export default function SendPoktShannon({ onCancel }: SendPoktProps) {
  const selectedChain = useAppSelector(selectedChainSelector);
  const selectedNetwork = useAppSelector(selectedNetworkSelector);
  const accounts = useAppSelector(accountsSelector);
  const selectedProtocol = useAppSelector(selectedProtocolSelector);
  const selectedAccountAddress = useAppSelector(selectedAccountAddressSelector);

  const getFeeOptions = (data: TransactionFormValues) : CosmosFeeRequestOption => {
    return {
      protocol: SupportedProtocols.Cosmos,
      transaction: {
        protocol: SupportedProtocols.Cosmos,
        transactionType: CosmosTransactionTypes.Send,
        amount: '1',
        privateKey: "",
        to: data.recipientAddress ?? "",
        from: data.fromAddress ?? "",
        gas: data.pocketGasAuto ? 'auto' : data.pocketGasInput ?? selectedNetwork.defaultGasEstimation,
        gasPrice: data.pocketGasPrice,
        gasAdjustment: data.pocketGasAdjustment,
        messages: [
          {
            type: CosmosTransactionTypes.Send,
            payload: {
              amount: '1',
              toAddress: data.recipientAddress ?? "",
              fromAddress: data.fromAddress ?? "",
            }
          }
        ]
      },
    };
  };

  return (
    <BaseTransaction
      chainId={selectedChain}
      protocol={selectedProtocol}
      fromAddress={selectedAccountAddress}
      getFeeOptions={getFeeOptions}
      getTransaction={(data) => {
        const accountId = accounts.find(
          (item) =>
            item.address === data.fromAddress && item.protocol === data.protocol
        )?.id;

        return {
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
          transactionParams: {
            gas: data.pocketGasAuto ? 'auto' : data.pocketGasInput ?? selectedNetwork.defaultGasEstimation,
            gasPrice: data.pocketGasPrice,
            gasAdjustment: data.pocketGasAdjustment,
            memo: data.memo || undefined,
          },
        };
      }}
      defaultFormValue={{
        memo: "",
        pocketGasAuto: selectedNetwork.defaultGasUsed === "auto",
        pocketGasInput: selectedNetwork.defaultGasUsed && selectedNetwork.defaultGasUsed !== "auto" ? selectedNetwork.defaultGasUsed : undefined,
      }}
      form={<SendFormPocket />}
      summary={<Summary />}
      success={<Submitted onCancel={onCancel} />}
      onCancel={onCancel}
      onDone={onCancel}
    />
  );
}
