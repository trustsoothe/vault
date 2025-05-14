import { SupplierServiceConfig } from "../BaseTransaction";
import { CosmosFee, SupportedProtocols } from "@soothe/vault";
import useUsdPrice from "../../hooks/useUsdPrice";
import Summary, { SummaryProps } from "../../components/Summary";
import { AccountInfoFromAddress } from "../../components/AccountInfo";
import React, { useEffect, useState } from "react";
import { AmountWithUsd } from "../../Transaction/BaseSummary";
import SupplierServicesSummary from "../StakeSupplier/Summary/Services";
import { getAddressFromPublicKey } from "../../../utils/networkOperations";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

interface ClaimMorseSupplierSummaryProps {
  fromAddress: string;
  chainId: string;
  ownerAddress?: string;
  operatorAddress?: string;
  morsePublicKey: string;
  morseSignature: string;
  supplierServices: SupplierServiceConfig[];
  fee: {
    fee: CosmosFee;
    fetchingFee: boolean;
  };
}

export default function ClaimMorseSupplierSummary({
  fromAddress,
  chainId,
  ownerAddress = fromAddress,
  operatorAddress = fromAddress,
  supplierServices,
  fee,
  morsePublicKey,
  morseSignature,
}: ClaimMorseSupplierSummaryProps) {
  const [morseAddress, setMorseAddress] = useState<string>("");

  useEffect(() => {
    getAddressFromPublicKey(morsePublicKey).then(setMorseAddress);
  }, []);

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

  firstSummary.rows.push(
    {
      type: "row",
      label: "Morse Node",
      value: (
        <AccountInfoFromAddress
          address={morseAddress}
          protocol={SupportedProtocols.Pocket}
        />
      ),
    },
    {
      containerProps: {
        sx: {
          alignItems: "flex-start",
          "& p": {
            overflow: "unset",
          },
        },
      },
      type: "row",
      label: "Morse Signature",
      value: (
        <Stack width={1} marginLeft={-9} marginTop={2}>
          <Typography fontSize={11} sx={{ wordBreak: "break-all" }}>
            {morseSignature}
          </Typography>
        </Stack>
      ),
    }
  );

  firstSummary.rows.push({
    type: "row",
    label: "Stake Amount",
    value: (
      <AmountWithUsd
        balance={0}
        decimals={6}
        symbol={coinSymbol}
        usdBalance={0 * usdPrice}
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
