import type { TransactionFormValues } from "./BaseTransaction";
import React from "react";
import Stack from "@mui/material/Stack";
import Skeleton from "@mui/material/Skeleton";
import { useFormContext } from "react-hook-form";
import Typography from "@mui/material/Typography";
import { SupportedProtocols } from "@poktscan/vault";
import useSelectedAsset from "../Home/hooks/useSelectedAsset";
import useBalanceAndUsdPrice from "../hooks/useBalanceAndUsdPrice";
import { roundAndSeparate } from "../../utils/ui";

interface BalanceLabelProps {
  marginTop?: number | string;
  considerAsset?: boolean;
}

export default function BalanceLabel({
  marginTop,
  considerAsset = true,
}: BalanceLabelProps) {
  const asset = useSelectedAsset();
  const { watch } = useFormContext<TransactionFormValues>();

  const [fromAddress, protocol, chainId] = watch([
    "fromAddress",
    "protocol",
    "chainId",
  ]);

  const { isLoadingBalance, balance, coinSymbol } = useBalanceAndUsdPrice({
    address: fromAddress,
    protocol,
    chainId,
    asset: considerAsset ? asset : undefined,
  });

  return (
    <Stack
      spacing={1}
      direction={"row"}
      marginTop={marginTop}
      alignItems={"center"}
      justifyContent={"space-between"}
      sx={{
        "& p": {
          fontSize: 11,
          lineHeight: "16px",
        },
      }}
    >
      <Typography>Balance</Typography>

      {isLoadingBalance ? (
        <Skeleton width={48} height={16} variant={"rectangular"} />
      ) : (
        <Stack
          flexGrow={1}
          minWidth={0}
          spacing={0.6}
          direction={"row"}
          alignItems={"center"}
        >
          <Typography
            noWrap={true}
            flexGrow={1}
            minWidth={0}
            textAlign={"right"}
          >
            {roundAndSeparate(
              balance,
              protocol === SupportedProtocols.Pocket ? 6 : 18,
              "0.00"
            )}
          </Typography>
          <Typography>{coinSymbol}</Typography>
        </Stack>
      )}
    </Stack>
  );
}
