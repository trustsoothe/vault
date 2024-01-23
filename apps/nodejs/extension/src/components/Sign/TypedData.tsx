import type { AppSignTypedDataReq } from "../../types/communications/signTypedData";
import Stack from "@mui/material/Stack";
import { useTheme } from "@mui/material";
import Button from "@mui/material/Button";
import React, { useCallback } from "react";
import capitalize from "lodash/capitalize";
import Divider from "@mui/material/Divider";
import { useLocation } from "react-router-dom";
import Typography from "@mui/material/Typography";
import TooltipOverflow from "../common/TooltipOverflow";
import NetworkAndAccount from "../Transfer/NetworkAndAccount";
import AppToBackground from "../../controllers/communication/AppToBackground";

interface RenderMessageProps {
  message: object | object[];
  marginLeft?: number;
}

const RenderMessage: React.FC<RenderMessageProps> = ({
  message,
  marginLeft = 0.5,
}) => {
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
          <Typography fontSize={13} fontWeight={500} marginBottom={0.4}>
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
          <TooltipOverflow
            text={value}
            textProps={{
              fontSize: 12,
            }}
            enableTextCopy={false}
          />
        </Stack>
      );
    }
  }

  return <>{children}</>;
};

const SignTypedData: React.FC = () => {
  const theme = useTheme();
  const location = useLocation();
  const request: AppSignTypedDataReq = location.state;

  const sendResponse = useCallback((accepted: boolean) => {
    AppToBackground.answerSignTypedData({
      request,
      accepted,
    }).catch();
  }, []);

  return (
    <Stack flexGrow={1} justifyContent={"space-between"} width={400}>
      <Stack flexGrow={1} alignItems={"center"}>
        <NetworkAndAccount
          fromAddress={request.address}
          chainId={request.chainId}
          protocol={request.protocol}
        />
        <Typography
          width={300}
          height={60}
          fontSize={18}
          marginTop={1.5}
          fontWeight={700}
          lineHeight={"28px"}
          textAlign={"center"}
          sx={{ userSelect: "none" }}
          color={theme.customColors.primary999}
        >
          Only sign messages from your trusted websites.
        </Typography>
        <Typography
          fontSize={14}
          fontWeight={700}
          lineHeight={"28px"}
          textAlign={"left"}
          sx={{ userSelect: "none" }}
          marginLeft={5.3}
          marginTop={-0.5}
          width={1}
          color={theme.customColors.primary999}
        >
          Domain
        </Typography>
        <Stack
          borderRadius={"4px"}
          marginX={2}
          paddingY={1}
          width={360}
          spacing={0.5}
          boxSizing={"border-box"}
          border={`1px solid ${theme.customColors.dark25}`}
        >
          <Stack
            direction={"row"}
            width={360}
            spacing={1}
            paddingX={1}
            boxSizing={"border-box"}
          >
            <Stack direction={"row"} boxSizing={"border-box"} spacing={0.7}>
              <Typography fontSize={12} fontWeight={500}>
                Name:
              </Typography>
              <Typography fontSize={12}>
                {request?.data?.domain?.name}
              </Typography>
            </Stack>
            <Divider
              orientation={"vertical"}
              flexItem={true}
              sx={{
                marginY: "3px!important",
              }}
            />
            <Stack direction={"row"} boxSizing={"border-box"} spacing={0.5}>
              <Typography fontSize={12}>Version:</Typography>
              <Typography fontSize={12}>
                {request?.data?.domain?.version || 1}
              </Typography>
            </Stack>
          </Stack>
          <Stack
            direction={"row"}
            width={360}
            paddingX={1}
            spacing={0.5}
            boxSizing={"border-box"}
          >
            <Typography fontSize={12} fontWeight={500}>
              Contract:
            </Typography>
            <TooltipOverflow
              text={request?.data?.domain?.verifyingContract}
              textProps={{
                fontSize: 12,
              }}
            />
          </Stack>
        </Stack>
        <Typography
          fontSize={14}
          fontWeight={700}
          lineHeight={"28px"}
          textAlign={"left"}
          sx={{ userSelect: "none" }}
          marginLeft={5.3}
          width={1}
          marginTop={1}
          color={theme.customColors.primary999}
        >
          Message
        </Typography>
        <Stack
          borderRadius={"4px"}
          marginX={2}
          padding={1}
          width={360}
          height={198}
          spacing={0.5}
          boxSizing={"border-box"}
          border={`1px solid ${theme.customColors.dark25}`}
          marginBottom={2}
          overflow={"auto"}
        >
          <Typography fontWeight={500}>
            {capitalize(request?.data?.primaryType || "")}
          </Typography>
          <RenderMessage message={request?.data?.message || {}} />
        </Stack>
      </Stack>
      <Stack
        direction={"row"}
        spacing={2}
        width={400}
        boxSizing={"border-box"}
        paddingX={2}
      >
        <Button
          onClick={() => sendResponse(false)}
          sx={{
            fontWeight: 700,
            color: theme.customColors.dark50,
            borderColor: theme.customColors.dark50,
            height: 36,
            borderWidth: 1.5,
            fontSize: 16,
          }}
          variant={"outlined"}
          fullWidth
        >
          Reject
        </Button>
        <Button
          sx={{
            fontWeight: 700,
            height: 36,
            fontSize: 16,
          }}
          variant={"contained"}
          fullWidth
          onClick={() => sendResponse(true)}
        >
          Sign
        </Button>
      </Stack>
    </Stack>
  );
};

export default SignTypedData;
