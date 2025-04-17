import { SupplierServiceConfig } from "../../BaseTransaction";
import { CosmosFee, SupportedProtocols } from "@soothe/vault";
import useUsdPrice from "../../../hooks/useUsdPrice";
import Summary, { SummaryProps } from "../../../components/Summary";
import { AmountWithUsd } from "../../../Transaction/BaseSummary";
import React from "react";
import { AccountInfoFromAddress } from "../../../components/AccountInfo";
import SupplierServicesSummary from "./Services";

interface StakeSupplierSummaryProps {
  fromAddress: string;
  chainId: string;
  ownerAddress?: string;
  operatorAddress?: string;
  amount: number;
  supplierServices: SupplierServiceConfig[];
  fee: {
    fee: CosmosFee;
    fetchingFee: boolean;
  };
}

export default function StakeSupplierSummary({
  fromAddress,
  chainId,
  operatorAddress = fromAddress,
  ownerAddress = operatorAddress,
  amount,
  supplierServices,
  fee,
}: StakeSupplierSummaryProps) {
  const { coinSymbol, usdPrice, isLoading } = useUsdPrice({
    protocol: SupportedProtocols.Cosmos,
    chainId,
  });

  const firstSummary: SummaryProps = {
    rows: [
      {
        type: "row",
        label: "Signer",
        value: (
          <AccountInfoFromAddress
            address={fromAddress}
            protocol={SupportedProtocols.Cosmos}
          />
        ),
      },
      {
        type: "row",
        label: "Operator Address",
        value: (
          <AccountInfoFromAddress
            address={operatorAddress}
            protocol={SupportedProtocols.Cosmos}
          />
        ),
      },
    ],
  };

  if (ownerAddress !== operatorAddress) {
    firstSummary.rows.push({
      type: "row",
      label: "Owner Address",
      value: (
        <AccountInfoFromAddress
          address={ownerAddress}
          protocol={SupportedProtocols.Cosmos}
        />
      ),
    });
  }

  firstSummary.rows.push({
    type: "row",
    label: "Stake Amount",
    value: (
      <AmountWithUsd
        balance={amount}
        decimals={6}
        symbol={coinSymbol}
        usdBalance={amount * usdPrice}
        isLoadingUsdPrice={isLoading}
      />
    ),
    containerProps: {
      sx: {
        "& > p": {
          minWidth: 80,
        },
      },
    },
  });

  if (fee) {
    firstSummary.rows.push({
      type: "row",
      label: "Fee",
      value: `${fee.fee?.value || 0} ${coinSymbol}`,
    });
  }

  firstSummary.rows.push(
    {
      type: "divider",
    },
    {
      type: "row",
      label: "Services",
      value: <SupplierServicesSummary services={supplierServices} />,
      containerProps: {
        sx: {
          alignItems: "flex-start",
        },
      },
    }
  );

  return <Summary {...firstSummary} />;
}
