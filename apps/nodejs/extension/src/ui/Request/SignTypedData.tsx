import type { AppSignTypedDataReq } from "../../types/communications/signTypedData";
import { useLocation } from "react-router-dom";
import Stack from "@mui/material/Stack";
import capitalize from "lodash/capitalize";
import Typography from "@mui/material/Typography";
import { closeSnackbar, SnackbarKey } from "notistack";
import React, { useEffect, useRef, useState } from "react";
import { SupportedProtocols } from "@soothe/vault";
import AppToBackground from "../../controllers/communication/AppToBackground";
import Summary, { SummaryRowItem } from "../components/Summary";
import { isValidAddress } from "../../utils/networkOperations";
import CopyAddressButton from "../Home/CopyAddressButton";
import DialogButtons from "../components/DialogButtons";
import { enqueueErrorSnackbar } from "../../utils/ui";
import { WIDTH } from "../../constants/ui";
import RequestInfo from "./RequestInfo";
import { themeColors } from "../theme";

interface RenderMessageProps {
  message: object | object[];
  marginLeft?: number;
  fontSize?: number;
  capitalizeMessage?: boolean;
}

export function RenderMessage({
  message,
  marginLeft = 0.5,
  capitalizeMessage = true,
  fontSize = 13,
}: RenderMessageProps) {
  const children: React.ReactNode[] = [];

  for (const key in message) {
    const value = message[key];

    if (typeof value === "object" && value) {
      children.push(
        <Stack
          marginLeft={`${marginLeft * 10}px!important`}
          key={key + marginLeft.toString()}
          marginTop={"5px!important"}
        >
          <Typography
            fontSize={fontSize}
            color={themeColors.black}
            fontWeight={400}
            marginBottom={0.4}
          >
            {capitalizeMessage ? capitalize(key) : key}:
          </Typography>
          <RenderMessage
            message={value}
            marginLeft={marginLeft + 0.5}
            capitalizeMessage={capitalizeMessage}
            fontSize={fontSize}
          />
        </Stack>
      );
    } else {
      const isAddress = isValidAddress(value, SupportedProtocols.Ethereum);
      console.log({ value });
      children.push(
        <Stack
          direction={"row"}
          marginLeft={`${marginLeft * 10}px!important`}
          key={key + marginLeft.toString()}
          spacing={0.7}
          marginBottom={0.3}
        >
          <Typography
            fontSize={fontSize === 13 ? fontSize - 1 : fontSize}
            lineHeight={isAddress ? "19.5px" : undefined}
          >
            {capitalizeMessage ? capitalize(key) : key}:
          </Typography>
          {isAddress ? (
            <CopyAddressButton
              address={value}
              sxProps={{
                paddingTop: "2px!important",
                boxShadow: "none",
                marginRight: -0.8,
                color: themeColors.black,
                marginLeft: "0!important",
                height: 19.5,
                backgroundColor: "transparent",
                fontSize,
              }}
            />
          ) : (
            <Typography
              color={themeColors.black}
              sx={{ wordBreak: "break-word" }}
              fontSize={fontSize}
            >
              {!value && typeof value === "object" ? "null" : value}
            </Typography>
          )}
        </Stack>
      );
    }
  }

  return <>{children}</>;
}

export default function SignTypedData() {
  const errorSnackbarKey = useRef<SnackbarKey>();
  const [isLoading, setIsLoading] = useState(false);
  const location = useLocation();
  const signRequest: AppSignTypedDataReq = location.state;

  const closeSnackbars = () => {
    if (errorSnackbarKey.current) {
      closeSnackbar(errorSnackbarKey.current);
      errorSnackbarKey.current = null;
    }
  };

  useEffect(() => {
    return closeSnackbars;
  }, []);

  const sendResponse = (accepted: boolean) => {
    setIsLoading(true);

    AppToBackground.answerSignTypedData({
      request: signRequest,
      accepted,
    })
      .then((res) => {
        if (res.error) {
          errorSnackbarKey.current = enqueueErrorSnackbar({
            variant: "error",
            message: {
              title: "Failed to answer the request",
              content: `There was an error trying to ${
                accepted ? "accept" : "reject"
              } the signature request.`,
            },
            onRetry: () => sendResponse(accepted),
          });
        } else {
          closeSnackbars();
        }
      })
      .catch(() => {
        errorSnackbarKey.current = enqueueErrorSnackbar({
          variant: "error",
          message: {
            title: "Failed to answer the request",
            content: `There was an error trying to ${
              accepted ? "accept" : "reject"
            } the signature request.`,
          },
          onRetry: () => sendResponse(accepted),
        });
      })
      .finally(() => setIsLoading(false));
  };

  const summaryRows: Array<SummaryRowItem> = [];

  if (signRequest?.data?.domain?.name) {
    summaryRows.push({
      type: "row",
      label: "Name",
      value: signRequest.data.domain.name,
    });
  }

  summaryRows.push({
    type: "row",
    label: "Version",
    value: signRequest?.data?.domain?.version || 1,
  });

  if (signRequest?.data?.domain?.verifyingContract) {
    summaryRows.push({
      type: "row",
      label: "Name",
      value: (
        <CopyAddressButton
          address={signRequest.data.domain.verifyingContract}
          sxProps={{
            fontWeight: 500,
            boxShadow: "none",
            marginRight: -0.8,
            color: themeColors.black,
            backgroundColor: "transparent",
          }}
        />
      ),
    });
  }

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
        <Summary rows={summaryRows} />
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
            isLoading,
            children: "Sign",
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
