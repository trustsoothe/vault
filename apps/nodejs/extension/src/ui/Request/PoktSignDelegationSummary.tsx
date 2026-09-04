import { SupportedProtocols } from "@soothe/vault";
import React from "react";
import Summary, { SummaryRowItem } from "../components/Summary";
import { AccountInfoFromAddress } from "../components/AccountInfo";
import { AmountWithUsd } from "../Transaction/BaseSummary";
import useBalanceAndUsdPrice from "../hooks/useBalanceAndUsdPrice";

interface PoktSignDelegationSummaryProps {
  delegatorAddress: string;
  chainId: string;
  validators: Array<{ label: string; address: string }>;
  /** Amount in POKT. Omitted for messages without an amount (withdraw rewards). */
  amount?: number;
  memo?: string;
}

export default function PoktSignDelegationSummary({
  delegatorAddress,
  chainId,
  validators,
  amount,
  memo,
}: PoktSignDelegationSummaryProps) {
  const { coinSymbol, usdPrice, isLoadingUsdPrice } = useBalanceAndUsdPrice({
    address: delegatorAddress,
    protocol: SupportedProtocols.Cosmos,
    chainId,
  });

  const rows: Array<SummaryRowItem> = [
    {
      type: "row",
      label: "Delegator",
      value: (
        <AccountInfoFromAddress
          address={delegatorAddress}
          protocol={SupportedProtocols.Cosmos}
        />
      ),
    },
    ...validators.map(
      ({ label, address }): SummaryRowItem => ({
        type: "row",
        label,
        value: (
          <AccountInfoFromAddress
            address={address}
            protocol={SupportedProtocols.Cosmos}
          />
        ),
      })
    ),
  ];

  if (amount !== undefined) {
    rows.push(
      { type: "divider" },
      {
        type: "row",
        label: "Amount",
        value: (
          <AmountWithUsd
            symbol={coinSymbol}
            balance={amount}
            usdBalance={amount * usdPrice}
            isLoadingUsdPrice={isLoadingUsdPrice}
            decimals={6}
          />
        ),
      }
    );
  }

  if (memo) {
    rows.push({ type: "divider" }, { type: "row", label: "Memo", value: memo });
  }

  return <Summary rows={rows} />;
}
