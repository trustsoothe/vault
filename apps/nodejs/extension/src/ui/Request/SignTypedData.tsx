import type { AppSignTypedDataReq } from "../../types/communications/signTypedData";
import { useLocation } from "react-router-dom";
import React, { useState } from "react";
import Stack from "@mui/material/Stack";
import capitalize from "lodash/capitalize";
import Typography from "@mui/material/Typography";
import { SupportedProtocols } from "@poktscan/vault";
import AppToBackground from "../../controllers/communication/AppToBackground";
import { isValidAddress } from "../../utils/networkOperations";
import CopyAddressButton from "../Home/CopyAddressButton";
import DialogButtons from "../components/DialogButtons";
import { enqueueErrorSnackbar } from "../../utils/ui";
import Summary from "../components/Summary";
import { WIDTH } from "../../constants/ui";
import RequestInfo from "./RequestInfo";
import { themeColors } from "../theme";

interface RenderMessageProps {
  message: object | object[];
  marginLeft?: number;
}

function RenderMessage({ message, marginLeft = 0.5 }: RenderMessageProps) {
  const children: React.ReactNode[] = [];

  for (const key in message) {
    const value = message[key];

    if (typeof value === "object") {
      children.push(
        <Stack
          marginLeft={`${marginLeft * 10}px!important`}
          key={key + marginLeft.toString()}
          marginTop={"5px!important"}
        >
          <Typography
            fontSize={13}
            color={themeColors.black}
            fontWeight={400}
            marginBottom={0.4}
          >
            {capitalize(key)}:
          </Typography>
          <RenderMessage message={value} marginLeft={marginLeft + 0.5} />
        </Stack>
      );
    } else {
      children.push(
        <Stack
          direction={"row"}
          marginLeft={`${marginLeft * 10}px!important`}
          key={key + marginLeft.toString()}
          spacing={0.7}
          marginBottom={0.3}
        >
          <Typography fontSize={12}>{capitalize(key)}:</Typography>
          {isValidAddress(value, SupportedProtocols.Ethereum) ? (
            <CopyAddressButton
              address={value}
              sxProps={{
                boxShadow: "none",
                marginRight: -0.8,
                color: themeColors.black,
                marginLeft: "0!important",
                height: 19.5,
                backgroundColor: "transparent",
              }}
            />
          ) : (
            <Typography
              color={themeColors.black}
              sx={{ wordBreak: "break-word" }}
            >
              {value}
            </Typography>
          )}
        </Stack>
      );
    }
  }

  return <>{children}</>;
}

export default function SignTypedData() {
  const [isLoading, setIsLoading] = useState(false);
  const location = useLocation();
  const signRequest: AppSignTypedDataReq = location.state;

  const sendResponse = (accepted: boolean) => {
    setIsLoading(true);

    AppToBackground.answerSignTypedData({
      request: signRequest,
      accepted,
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
          onRetry: () => sendResponse(accepted),
        });
      })
      .finally(() => setIsLoading(false));
  };

  return (
    <Stack flexGrow={1} width={WIDTH}>
      <RequestInfo
        title={"Signature Request"}
        description={"Only sign requests from trusted websites."}
        origin={signRequest.origin}
      />
      <Stack
        bgcolor={themeColors.white}
        padding={2.4}
        flexGrow={1}
        minHeight={0}
        flexBasis={"1px"}
        overflow={"auto"}
      >
        <Summary
          rows={[
            {
              type: "row",
              label: "Name",
              value: signRequest?.data?.domain?.name,
            },
            {
              type: "row",
              label: "Version",
              value: signRequest?.data?.domain?.version || 1,
            },
            {
              type: "row",
              label: "Name",
              value: (
                <CopyAddressButton
                  address={signRequest?.data?.domain?.verifyingContract}
                  sxProps={{
                    boxShadow: "none",
                    marginRight: -0.8,
                    color: themeColors.black,
                    backgroundColor: "transparent",
                  }}
                />
              ),
            },
          ]}
        />
        <Stack
          marginTop={1.6}
          borderRadius={"8px"}
          padding={"12px 14px 11px"}
          bgcolor={themeColors.bgLightGray}
        >
          <Typography variant={"subtitle2"} fontWeight={400}>
            {capitalize(signRequest?.data?.primaryType || "Message")}
          </Typography>
          <RenderMessage message={signRequest?.data?.message || {}} />
        </Stack>
      </Stack>
      <Stack height={85}>
        <DialogButtons
          primaryButtonProps={{
            children: "Sign",
            disabled: isLoading,
            onClick: () => sendResponse(true),
          }}
          secondaryButtonProps={{
            children: "Cancel",
            disabled: isLoading,
            onClick: () => sendResponse(false),
          }}
        />
      </Stack>
    </Stack>
  );
}
