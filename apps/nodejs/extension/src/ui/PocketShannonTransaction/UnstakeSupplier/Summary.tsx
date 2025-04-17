import { CosmosFee, SupportedProtocols } from "@soothe/vault";
import useUsdPrice from "../../hooks/useUsdPrice";
import Summary, { SummaryProps } from "../../components/Summary";
import { AccountInfoFromAddress } from "../../components/AccountInfo";
import React from "react";
import Stack from "@mui/material/Stack";

interface UnstakeSupplierSummaryProps {
  signerAddress: string;
  chainId: string;
  operatorAddress?: string;
  fee: {
    fee: CosmosFee;
    fetchingFee: boolean;
  };
}

export default function UnstakeSupplierSummary({
  signerAddress,
  chainId,
  operatorAddress = signerAddress,
  fee,
}) {
  const { coinSymbol } = useUsdPrice({
    protocol: SupportedProtocols.Cosmos,
    chainId,
  });

  const summaryRows: SummaryProps["rows"] = [
    {
      type: "row",
      label: "Signer",
      value: (
        <AccountInfoFromAddress
          address={signerAddress}
          protocol={SupportedProtocols.Cosmos}
        />
      ),
    },
    {
      type: "row",
      label: "Node",
      value: (
        <AccountInfoFromAddress
          address={operatorAddress}
          protocol={SupportedProtocols.Cosmos}
        />
      ),
    },
  ];

  if (fee) {
    summaryRows.push({
      type: "row",
      label: "Fee",
      value: `${fee.fee?.value || 0} ${coinSymbol}`,
    });
  }

  return (
    <Stack overflow={"auto"}>
      <Summary rows={summaryRows} />
    </Stack>
  );
}
