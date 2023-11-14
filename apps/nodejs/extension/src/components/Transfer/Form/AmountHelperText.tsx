import type { FormValues } from "../index";
import React from "react";
import Stack from "@mui/material/Stack";
import Skeleton from "@mui/material/Skeleton";
import { useFormContext } from "react-hook-form";
import Typography from "@mui/material/Typography";
import { AmountStatus } from "./AmountFeeInputs";
import {
  EthereumNetworkFee,
  PocketNetworkFee,
  SupportedProtocols,
} from "@poktscan/keyring";

interface AmountHelperTextProps {
  networkFee: PocketNetworkFee | EthereumNetworkFee;
  feeFetchStatus: AmountStatus;
  getFee: () => void;
}

const AmountHelperText: React.FC<AmountHelperTextProps> = ({
  feeFetchStatus,
  networkFee,
  getFee,
}) => {
  const { watch } = useFormContext<FormValues>();
  const [protocol] = watch(["protocol"]);
  let component: React.ReactNode;

  if (feeFetchStatus === "error") {
    component = (
      <Stack direction={"row"} alignItems={"center"} spacing={"5px"}>
        <Typography fontSize={12}>Error.</Typography>
        <Typography
          fontSize={12}
          fontWeight={600}
          sx={{ cursor: "pointer", textDecoration: "underline" }}
          onClick={getFee}
        >
          Retry
        </Typography>
      </Stack>
    );
  }

  if (protocol === SupportedProtocols.Pocket) {
    component = (
      <Stack direction={"row"} alignItems={"center"} spacing={"10px"}>
        <Stack direction={"row"} alignItems={"center"}>
          <Typography fontSize={12} fontWeight={600}>
            Min:
          </Typography>
          {feeFetchStatus === "loading" ? (
            <Skeleton
              width={40}
              height={20}
              variant={"rectangular"}
              sx={{ marginLeft: "5px" }}
            />
          ) : (
            <Typography fontSize={12} sx={{ marginLeft: "5px" }}>
              {(networkFee as PocketNetworkFee)?.value || 0}
            </Typography>
          )}
        </Stack>
      </Stack>
    );
  }

  if (component) {
    return (
      <Stack
        direction={"row"}
        alignItems={"center"}
        justifyContent={"space-between"}
        height={30}
        width={"100%"}
        component={"span"}
      >
        {component}
      </Stack>
    );
  }
};

export default AmountHelperText;
