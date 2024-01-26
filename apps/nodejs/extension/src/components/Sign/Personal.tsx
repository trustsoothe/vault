import type { AppPersonalSignReq } from "../../types/communications/personalSign";
import { toAscii } from "web3-utils";
import Stack from "@mui/material/Stack";
import { useTheme } from "@mui/material";
import Button from "@mui/material/Button";
import React, { useCallback } from "react";
import { useLocation } from "react-router-dom";
import Typography from "@mui/material/Typography";
import { useAppSelector } from "../../hooks/redux";
import NetworkAndAccount from "../Transfer/NetworkAndAccount";
import AppToBackground from "../../controllers/communication/AppToBackground";
import { selectedChainByProtocolSelector } from "../../redux/selectors/network";

const PersonalSign: React.FC = () => {
  const theme = useTheme();
  const location = useLocation();
  const request: AppPersonalSignReq = location.state;
  const selectedChainByProtocol = useAppSelector(
    selectedChainByProtocolSelector
  );
  const chainId = selectedChainByProtocol[request.protocol];

  const sendResponse = useCallback(
    (accepted: boolean) => {
      AppToBackground.answerPersonalSign({
        request,
        accepted,
      }).catch();
    },
    [request]
  );

  return (
    <Stack flexGrow={1} justifyContent={"space-between"} width={400}>
      <Stack flexGrow={1} alignItems={"center"}>
        <NetworkAndAccount
          fromAddress={request.address}
          chainId={chainId}
          protocol={request.protocol}
        />
        <Typography
          width={300}
          height={60}
          fontSize={18}
          marginTop={2.5}
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
          width={1}
          marginTop={1}
          color={theme.customColors.primary999}
        >
          Message
        </Typography>
        <Stack
          marginX={2}
          padding={1}
          width={360}
          height={274}
          spacing={0.5}
          marginBottom={2}
          overflow={"auto"}
          borderRadius={"4px"}
          boxSizing={"border-box"}
          bgcolor={theme.customColors.dark5}
          border={`1px solid ${theme.customColors.dark25}`}
        >
          <Typography fontSize={10} color={theme.customColors.dark75}>
            {toAscii(request.challenge)}
          </Typography>
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

export default PersonalSign;
