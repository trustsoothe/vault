import {CosmosFee, PocketNetworkFee, SupportedProtocols} from "@soothe/vault";
import type { TransactionFormValues } from "./BaseTransaction";
import React from "react";
import Stack from "@mui/material/Stack";
import Skeleton from "@mui/material/Skeleton";
import { useFormContext } from "react-hook-form";
import Typography from "@mui/material/Typography";
import { roundAndSeparate } from "../../utils/ui";

export interface PocketFeeLabelProps {
  marginTop?: string | number;
}

export default function PocketFeeLabel({ marginTop }: Readonly<PocketFeeLabelProps>) {
  const { watch } = useFormContext<TransactionFormValues>();

  const [networkFee, fetchingFee, protocol, recipientAddress] = watch([
    "fee",
    "fetchingFee",
    "protocol",
    "recipientAddress",
  ]);

  return (
    // todo: create component
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
      <Typography>Fee</Typography>

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
            {protocol === SupportedProtocols.Cosmos && !recipientAddress
              ? "-"
              : roundAndSeparate(
                (networkFee as CosmosFee)?.value,
                6,
                "0.00"
              )}
          </Typography>
          <Typography>POKT</Typography>
        </Stack>
      )}
    </Stack>
  );
}
