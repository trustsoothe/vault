import type { AppSwitchChainReq } from "../../types/communications/switchChain";
import React, { useState } from "react";
import Stack from "@mui/material/Stack";
import { useLocation } from "react-router-dom";
import Typography from "@mui/material/Typography";
import AppToBackground from "../../controllers/communication/AppToBackground";
import { labelByProtocolMap } from "../../constants/protocols";
import DialogButtons from "../components/DialogButtons";
import { enqueueErrorSnackbar } from "../../utils/ui";
import { useAppSelector } from "../../hooks/redux";
import Summary from "../components/Summary";
import RequestInfo from "./RequestInfo";
import {
  networksSelector,
  selectedChainByProtocolSelector,
} from "../../redux/selectors/network";
import { themeColors } from "../theme";

export default function SwitchNetwork() {
  const [isLoading, setIsLoading] = useState(false);
  const switchRequest: AppSwitchChainReq = useLocation()?.state;

  const networks = useAppSelector(networksSelector);
  const selectedChainByProtocol = useAppSelector(
    selectedChainByProtocolSelector
  );
  const selectedChain = selectedChainByProtocol[switchRequest.protocol];

  const currentNetwork = networks.find(
    (network) =>
      network.protocol === switchRequest.protocol &&
      network.chainId === selectedChain
  );

  const networkToChange = networks.find(
    (network) =>
      network.protocol === switchRequest.protocol &&
      network.chainId === switchRequest.chainId
  );

  const sendAnswer = (accepted: boolean) => {
    setIsLoading(true);
    AppToBackground.answerSwitchChain({
      accepted,
      request: switchRequest,
    })
      .catch(() => {
        enqueueErrorSnackbar({
          variant: "error",
          message: {
            title: "Failed to solve the request",
            content: `There was an error trying to ${
              accepted ? "accept" : "reject"
            } the request.`,
          },
          onRetry: () => sendAnswer(accepted),
        });
      })
      .finally(() => setIsLoading(false));
  };

  return (
    <Stack flexGrow={1}>
      <RequestInfo
        title={"Switch Network"}
        description={`Website wants to switch the selected network of ${
          labelByProtocolMap[switchRequest.protocol]
        }.`}
        origin={switchRequest.origin}
      />
      <Stack
        flexGrow={1}
        minHeight={0}
        padding={2.4}
        flexBasis={"1px"}
        bgcolor={themeColors.white}
      >
        <Summary
          rows={[
            {
              type: "row",
              label: "From",
              value: (
                <Stack direction={"row"} alignItems={"center"} spacing={0.7}>
                  <img
                    height={15}
                    width={15}
                    src={currentNetwork.iconUrl}
                    alt={`${currentNetwork.protocol}-${networkToChange.chainIdLabel}-icon`}
                  />
                  <Typography variant={"subtitle2"}>
                    {currentNetwork.label}
                  </Typography>
                </Stack>
              ),
            },
            {
              type: "divider",
            },
            {
              type: "row",
              label: "To",
              value: (
                <Stack direction={"row"} alignItems={"center"} spacing={0.7}>
                  <img
                    height={15}
                    width={15}
                    src={networkToChange.iconUrl}
                    alt={`${networkToChange.protocol}-${networkToChange.chainIdLabel}-icon`}
                  />
                  <Typography variant={"subtitle2"}>
                    {networkToChange.label}
                  </Typography>
                </Stack>
              ),
            },
          ]}
        />
      </Stack>
      <Stack height={85}>
        <DialogButtons
          primaryButtonProps={{
            children: "Switch",
            disabled: isLoading,
            onClick: () => sendAnswer(true),
          }}
          secondaryButtonProps={{
            children: "Cancel",
            disabled: isLoading,
            onClick: () => sendAnswer(false),
          }}
        />
      </Stack>
    </Stack>
  );
}
