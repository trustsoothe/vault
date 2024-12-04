import React from 'react';
import {
  SupportedTransferDestinations,
  SupportedTransferOrigins,
  CosmosFee,
} from "@poktscan/vault";
import Summary from "./Summary";
import Submitted from "./Submitted";
import {
  accountsSelector,
  selectedAccountAddressSelector,
} from "../../redux/selectors/account";
import {
  selectedChainSelector,
  selectedProtocolSelector,
} from "../../redux/selectors/network";
import SendFormPokt from "./SendFormPokt";
import BaseTransaction from "./BaseTransaction";
import { useAppSelector } from "../hooks/redux";

interface SendPoktProps {
  onCancel: () => void;
}

export default function SendPoktShannon({ onCancel }: SendPoktProps) {
  const selectedChain = useAppSelector(selectedChainSelector);
  const accounts = useAppSelector(accountsSelector);
  const selectedProtocol = useAppSelector(selectedProtocolSelector);
  const selectedAccountAddress = useAppSelector(selectedAccountAddressSelector);

  return (
    <BaseTransaction
      chainId={selectedChain}
      protocol={selectedProtocol}
      fromAddress={selectedAccountAddress}
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
            shannonFee: data.fee as CosmosFee,
            memo: data.memo || undefined,
          }
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
