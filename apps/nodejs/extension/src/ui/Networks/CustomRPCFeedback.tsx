import { CustomRPC } from "../../redux/slices/app";
import React from "react";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import SuccessActionBanner from "../components/SuccessActionBanner";
import WarningActionBanner from "../components/WarningActionBanner";
import { networksSelector } from "../../redux/selectors/network";
import { labelByProtocolMap } from "../../constants/protocols";
import { useAppSelector } from "../hooks/redux";
import Summary from "../components/Summary";

interface CustomRPCFeedbackProps {
  customRpc: CustomRPC;
  type: "saved" | "already_exists";
}

export default function CustomRPCFeedback({
  customRpc,
  type,
}: CustomRPCFeedbackProps) {
  const networks = useAppSelector(networksSelector);
  const networkOfRpc = networks.find(
    (network) =>
      network.protocol === customRpc.protocol &&
      network.chainId === customRpc.chainId
  );

  return (
    <Stack padding={2.4} spacing={1.6}>
      {type === "saved" ? (
        <SuccessActionBanner label={"RPC Saved"} />
      ) : (
        <WarningActionBanner label={"RPC Already Exists"} />
      )}
      <Summary
        rows={[
          {
            type: "row",
            label: "Name",
            value: (
              <Stack
                spacing={0.7}
                direction={"row"}
                alignItems={"center"}
                justifyContent={"flex-end"}
              >
                <img
                  height={15}
                  width={15}
                  src={networkOfRpc.iconUrl}
                  alt={`${networkOfRpc.protocol}-${networkOfRpc.chainId}-icon`}
                />
                <Typography variant={"subtitle2"}>
                  {labelByProtocolMap[customRpc.protocol]}
                </Typography>
              </Stack>
            ),
          },
          {
            type: "row",
            label: "Chain ID",
            value: networkOfRpc.chainIdLabel,
          },
          {
            type: "row",
            label: "URL",
            value: customRpc.url,
          },
        ]}
      />
      <Summary
        rows={[
          {
            type: "row",
            label: "Preferred",
            value: customRpc.isPreferred ? "Yes" : "No",
          },
        ]}
      />
    </Stack>
  );
}
