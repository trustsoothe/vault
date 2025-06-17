import {CosmosFee} from "@soothe/vault";
import type { TransactionFormValues } from "./BaseTransaction";
import React from "react";
import Stack from "@mui/material/Stack";
import Skeleton from "@mui/material/Skeleton";
import { useFormContext } from "react-hook-form";
import Typography from "@mui/material/Typography";
import { roundAndSeparate } from "../../utils/ui";

export interface PocketGasLabelProps {
  marginTop?: string | number;
  onClick?: () => void;
}

export default function PocketGasLabel({ marginTop, onClick }: Readonly<PocketGasLabelProps>) {
  const { watch } = useFormContext<TransactionFormValues>();

  const [networkFee, fetchingFee, recipientAddress] = watch([
    "fee",
    "fetchingFee",
    "protocol",
    "recipientAddress",
  ]);

  const {estimatedGas, gasAdjustmentUsed} = networkFee as CosmosFee ?? {};

  return (
    // todo: create component
    <Stack
      spacing={1}
      direction={"row"}
      marginTop={marginTop}
      alignItems={"center"}
      justifyContent={"space-between"}
      onClick={() => onClick?.()}
      sx={{
        "& p": {
          fontSize: 11,
          lineHeight: "16px",
        },
      }}
    >
      <Typography>Gas Estimate</Typography>

      {fetchingFee ? (
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
            {(!recipientAddress || !estimatedGas  || !gasAdjustmentUsed)
              ? "-"
              : Math.ceil(estimatedGas * gasAdjustmentUsed)
            }
          </Typography>
        </Stack>
      )}
    </Stack>
  );
}
