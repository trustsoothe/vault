import React from "react";
import {
  CosmosFee,
  SupportedTransferDestinations,
  SupportedTransferOrigins,
} from "@soothe/vault";
import Summary from "./Summary";
import Submitted from "./Submitted";
import {
  accountsSelector,
  selectedAccountAddressSelector,
} from "../../redux/selectors/account";
import {
  selectedChainSelector,
  selectedNetworkSelector,
  selectedProtocolSelector,
} from "../../redux/selectors/network";
import SendFormPokt from "./SendFormPokt";
import BaseTransaction, { TransactionFormValues } from "./BaseTransaction";
import { useAppSelector } from "../hooks/redux";

interface SendPoktProps {
  onCancel: () => void;
}

export default function SendPoktShannon({ onCancel }: SendPoktProps) {
  const selectedChain = useAppSelector(selectedChainSelector);
  const selectedNetwork = useAppSelector(selectedNetworkSelector);
  const accounts = useAppSelector(accountsSelector);
  const selectedProtocol = useAppSelector(selectedProtocolSelector);
  const selectedAccountAddress = useAppSelector(selectedAccountAddressSelector);

  const getFeeOptions = (data: TransactionFormValues) => {
    return {
      maxFeePerGas: (selectedNetwork?.defaultGasPrice ?? 0.001).toString(),
      toAddress: data.recipientAddress ?? "",
      fromAddress: data.fromAddress ?? "",
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
            // TODO: Refactor here to use a UI input value when we decide to make this configurable.
            maxFeePerGas: selectedNetwork.defaultGasPrice,
            memo: data.memo || undefined,
          },
        };
      }}
      defaultFormValue={{
        memo: "",
      }}
      form={<SendFormPokt />}
      summary={<Summary />}
      success={<Submitted onCancel={onCancel} />}
      onCancel={onCancel}
      onDone={onCancel}
    />
  );
}
