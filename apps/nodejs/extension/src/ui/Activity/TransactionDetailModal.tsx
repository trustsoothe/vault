import type { Transaction } from "../../controllers/datasource/Transaction";
import Decimal from "decimal.js";
import React, { useEffect, useRef } from "react";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import {
  SerializedAccountReference,
  SupportedProtocols,
} from "@poktscan/vault";
import { AmountWithUsd, getNetworkRow } from "../Transaction/BaseSummary";
import SuccessActionBanner from "../components/SuccessActionBanner";
import { contactsSelector } from "../../redux/selectors/contact";
import { networksSelector } from "../../redux/selectors/network";
import Summary, { SummaryRowItem } from "../components/Summary";
import useSelectedAsset from "../Home/hooks/useSelectedAsset";
import DialogButtons from "../components/DialogButtons";
import { Hash } from "../Transaction/TransactionHash";
import AccountInfo from "../components/AccountInfo";
import { useAppSelector } from "../hooks/redux";
import BaseDialog from "../components/BaseDialog";
import useUsdPrice from "../hooks/useUsdPrice";
import {
  accountsSelector,
  selectedAccountAddressSelector,
} from "../../redux/selectors/account";

interface ContentProps {
  transaction: Transaction;
}

function Content({ transaction }: ContentProps) {
  const asset = useSelectedAsset();
  const { usdPrice, coinSymbol, isLoading } = useUsdPrice({
    asset,
    protocol: transaction.protocol,
    chainId: transaction.chainId,
  });

  const selectedAccountAddress = useAppSelector(selectedAccountAddressSelector);
  const accounts = useAppSelector(accountsSelector);
  const contacts = useAppSelector(contactsSelector);
  const networks = useAppSelector(networksSelector);
  const network = networks.find(
    (network) =>
      network.protocol === transaction.protocol &&
      network.chainId === transaction.chainId
  );

  const wasReceived = selectedAccountAddress !== transaction.from;

  let fromAccount: SerializedAccountReference,
    recipientAccount: SerializedAccountReference;

  const recipientAddress = transaction.swapTo?.address || transaction.to;

  for (const account of accounts) {
    if (
      account.address === transaction.from &&
      account.protocol === transaction.protocol
    ) {
      fromAccount = account;
      continue;
    }

    if (
      account.address === recipientAddress &&
      account.protocol === (transaction.swapTo?.address || transaction.protocol)
    ) {
      recipientAccount = account;
    }
  }

  const recipientContact = contacts.find(
    (contact) =>
      contact.address === recipientAddress &&
      contact.protocol === (transaction.swapTo?.address || transaction.protocol)
  );

  const txDate = new Date(transaction.timestamp);
  const decimals =
    asset?.decimals || transaction.protocol === SupportedProtocols.Pocket
      ? 6
      : 18;
  const fee =
    transaction.protocol === SupportedProtocols.Ethereum
      ? transaction.maxFeeAmount || 0
      : transaction.fee;

  const firstSummaryRow: Array<SummaryRowItem> = [
    {
      type: "row",
      label: "From",
      value: (
        <AccountInfo address={transaction.from} name={fromAccount?.name} />
      ),
    },
    { type: "divider" },
    {
      type: "row",
      label: "To",
      value: (
        <AccountInfo
          address={transaction.to}
          name={recipientContact?.name || recipientAccount?.name}
          type={recipientContact ? "contact" : "account"}
        />
      ),
    },
  ];

  if (transaction.swapTo) {
    const toNetwork = networks.find(
      (network) =>
        network.protocol === transaction.swapTo.network.protocol &&
        network.chainId === transaction.swapTo.network.chainId
    );
    firstSummaryRow.splice(1, 0, getNetworkRow(network));
    firstSummaryRow.splice(4, 0, getNetworkRow(toNetwork));
  } else {
    firstSummaryRow.push({ type: "divider" }, getNetworkRow(network));
  }

  const rows: Array<SummaryRowItem> = [
    {
      type: "row",
      label: "Date",
      value: `${txDate.toLocaleDateString(undefined, {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })}`,
    },
    {
      type: "row",
      label: "Amount",
      value: (
        <AmountWithUsd
          symbol={coinSymbol}
          balance={transaction.amount}
          usdBalance={usdPrice * transaction.amount}
          isLoadingUsdPrice={isLoading}
          decimals={decimals}
        />
      ),
    },
    {
      type: "row",
      label: "Fee",
      value: (
        <AmountWithUsd
          symbol={network.currencySymbol}
          balance={fee}
          usdBalance={usdPrice * fee}
          isLoadingUsdPrice={isLoading}
          decimals={decimals}
        />
      ),
    },
  ];

  if (!asset) {
    const total = new Decimal(transaction.amount)
      .add(new Decimal(fee))
      .toNumber();

    rows.push({
      type: "row",
      label: "Total",
      value: (
        <AmountWithUsd
          symbol={coinSymbol}
          balance={total}
          usdBalance={usdPrice * total}
          isLoadingUsdPrice={isLoading}
          decimals={decimals}
        />
      ),
    });
  }

  return (
    <DialogContent
      sx={{
        padding: "20px!important",
        rowGap: 1.6,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <SuccessActionBanner
        label={`Transaction ${wasReceived ? "Received" : "Sent"}`}
      />
      <Summary rows={firstSummaryRow} />
      <Summary rows={rows} />
      <Summary
        rows={[
          {
            type: "row",
            label: "Tx. Hash",
            value: (
              <Hash
                hash={transaction.hash}
                protocol={transaction.protocol}
                chainId={transaction.chainId}
              />
            ),
          },
        ]}
      />
    </DialogContent>
  );
}

interface TransactionDetailModalProps {
  transaction: Transaction;
  onClose: () => void;
}

export default function TransactionDetailModal({
  transaction: transactionFromProps,
  onClose,
}: TransactionDetailModalProps) {
  const lastTxRef = useRef<Transaction>(null);

  useEffect(() => {
    if (transactionFromProps) {
      lastTxRef.current = transactionFromProps;
    } else {
      setTimeout(() => {
        lastTxRef.current = null;
      }, 150);
    }
  }, [transactionFromProps]);

  const transaction = transactionFromProps || lastTxRef.current;

  return (
    <BaseDialog
      open={!!transactionFromProps}
      title={"Transaction"}
      onClose={onClose}
      isLoading={false}
    >
      {transaction && <Content transaction={transaction} />}
      <DialogActions sx={{ height: 85, padding: 0 }}>
        <DialogButtons
          primaryButtonProps={{ children: "Done", onClick: onClose }}
        />
      </DialogActions>
    </BaseDialog>
  );
}
