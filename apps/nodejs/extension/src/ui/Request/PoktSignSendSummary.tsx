import { SerializedAccountReference, SupportedProtocols } from "@soothe/vault";
import { useAppSelector } from "../hooks/redux";
import { accountsSelector } from "../../redux/selectors/account";
import { contactsSelector } from "../../redux/selectors/contact";
import Summary, { SummaryRowItem } from "../components/Summary";
import AccountInfo from "../components/AccountInfo";
import React from "react";
import { AmountWithUsd } from "../Transaction/BaseSummary";
import useBalanceAndUsdPrice from "../hooks/useBalanceAndUsdPrice";

interface PoktSignSendSummaryProps {
  fromAddress: string;
  toAddress: string;
  chainId: string;
  memo?: string;
  amount: number;
  protocol: SupportedProtocols;
}

export default function PoktSignSendSummary({
  chainId,
  fromAddress,
  amount,
  memo,
  toAddress: recipientAddress,
  protocol,
}: PoktSignSendSummaryProps) {
  const { coinSymbol, usdPrice, isLoadingUsdPrice } = useBalanceAndUsdPrice({
    address: fromAddress,
    protocol,
    chainId,
  });

  const accounts = useAppSelector(accountsSelector);
  const contacts = useAppSelector(contactsSelector);

  let fromAccount: SerializedAccountReference,
    recipientAccount: SerializedAccountReference;

  for (const account of accounts) {
    if (account.address === fromAddress && account.protocol === protocol) {
      fromAccount = account;
      continue;
    }

    if (account.address === recipientAddress && account.protocol === protocol) {
      recipientAccount = account;
    }
  }

  const recipientContact = contacts.find(
    (contact) =>
      contact.address === recipientAddress && contact.protocol === protocol
  );

  const amountNum = Number(amount);

  const firstSummaryRows: Array<SummaryRowItem> = [
    {
      type: "row",
      label: "From",
      value: <AccountInfo address={fromAddress} name={fromAccount?.name} />,
    },
    {
      type: "row",
      label: "To",
      value: (
        <AccountInfo
          address={recipientAddress}
          name={recipientContact?.name || recipientAccount?.name}
          type={recipientContact ? "contact" : "account"}
        />
      ),
    },
    { type: "divider" },
    {
      type: "row",
      label: "Amount",
      value: (
        <AmountWithUsd
          symbol={coinSymbol}
          balance={amountNum}
          usdBalance={amountNum * usdPrice}
          isLoadingUsdPrice={isLoadingUsdPrice}
          decimals={6}
        />
      ),
    },
  ];

  if (memo) {
    firstSummaryRows.push(
      { type: "divider" },
      {
        type: "row",
        label: "Memo",
        value: memo,
      }
    );
  }

  return <Summary rows={firstSummaryRows} />;
}
