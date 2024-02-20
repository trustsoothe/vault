import type { AppSwitchChainReq } from "../../types/communications/switchChain";
import React, { useCallback, useMemo } from "react";
import Stack from "@mui/material/Stack";
import { useTheme } from "@mui/material";
import Button from "@mui/material/Button";
import { useLocation } from "react-router-dom";
import Typography from "@mui/material/Typography";
import { useAppSelector } from "../../hooks/redux";
import {
  networksSelector,
  selectedChainByProtocolSelector,
} from "../../redux/selectors/network";
import Requester from "../common/Requester";
import { labelByProtocolMap } from "../../constants/protocols";
import AppToBackground from "../../controllers/communication/AppToBackground";

const ChangeSelectedChain: React.FC = () => {
  const theme = useTheme();
  const currentRequest: AppSwitchChainReq = useLocation()?.state;

  const networks = useAppSelector(networksSelector);
  const selectedChainByProtocol = useAppSelector(
    selectedChainByProtocolSelector
  );
  const selectedChain = selectedChainByProtocol[currentRequest.protocol];

  const currentNetwork = useMemo(() => {
    return networks.find(
      (network) =>
        network.protocol === currentRequest.protocol &&
        network.chainId === selectedChain
    );
  }, [currentRequest?.protocol, selectedChain]);

  const networkToChange = useMemo(() => {
    return networks.find(
      (network) =>
        network.protocol === currentRequest.protocol &&
        network.chainId === currentRequest?.chainId
    );
  }, [currentRequest?.protocol, currentRequest?.chainId]);

  const sendAnswer = useCallback(
    (accepted: boolean) => {
      AppToBackground.answerSwitchChain({
        accepted,
        request: currentRequest,
      }).catch();
    },
    [currentRequest]
  );

  return (
    <Stack alignItems={"center"} justifyContent={"space-between"} height={1}>
      <Stack
        paddingX={2}
        width={1}
        boxSizing={"border-box"}
        alignItems={"center"}
      >
        <Typography
          width={335}
          height={60}
          fontSize={18}
          marginTop={2.5}
          fontWeight={700}
          marginBottom={1.5}
          lineHeight={"28px"}
          textAlign={"center"}
          sx={{ userSelect: "none" }}
          color={theme.customColors.primary999}
        >
          This site wants to switch the selected network of{" "}
          {labelByProtocolMap[currentRequest.protocol] ||
            currentRequest.protocol}
        </Typography>
        <Requester request={currentRequest} />
        <Typography
          fontSize={12}
          color={theme.customColors.dark50}
          marginTop={1}
          textAlign={"center"}
        >
          This will switch the selected network of{" "}
          {labelByProtocolMap[currentRequest.protocol] ||
            currentRequest.protocol}{" "}
          from
          <br />
          {currentNetwork?.chainIdLabel} to {networkToChange?.chainIdLabel}
        </Typography>
        <Stack spacing={2.5} marginTop={3}>
          <Stack
            height={44}
            width={1}
            position={"relative"}
            borderRadius={"4px"}
            border={`1px solid ${theme.customColors.primary250}`}
            alignItems={"center"}
            justifyContent={"center"}
            paddingX={1}
          >
            <Typography
              fontSize={10}
              position={"absolute"}
              top={-8}
              left={5}
              bgcolor={theme.customColors.white}
              color={theme.customColors.dark50}
              paddingX={0.7}
              lineHeight={"14px"}
            >
              From
            </Typography>
            <Stack
              direction={"row"}
              alignItems={"center"}
              justifyContent={"center"}
              spacing={0.5}
            >
              <img
                width={20}
                height={20}
                alt={`${currentNetwork?.chainIdLabel}-img`}
                src={currentNetwork?.iconUrl}
              />
              <Typography fontSize={14} fontWeight={500} whiteSpace={"nowrap"}>
                {currentNetwork?.label}
              </Typography>
            </Stack>
          </Stack>
          <Stack
            height={44}
            width={1}
            position={"relative"}
            borderRadius={"4px"}
            border={`1px solid ${theme.customColors.primary250}`}
            alignItems={"center"}
            justifyContent={"center"}
            paddingX={1}
          >
            <Typography
              fontSize={10}
              position={"absolute"}
              top={-8}
              left={5}
              bgcolor={theme.customColors.white}
              color={theme.customColors.dark50}
              paddingX={0.7}
              lineHeight={"14px"}
            >
              To
            </Typography>
            <Stack
              direction={"row"}
              alignItems={"center"}
              justifyContent={"center"}
              spacing={0.5}
            >
              <img
                width={20}
                height={20}
                alt={`${networkToChange?.chainIdLabel}-img`}
                src={networkToChange?.iconUrl}
              />
              <Typography fontSize={14} fontWeight={500} whiteSpace={"nowrap"}>
                {networkToChange?.label}
              </Typography>
            </Stack>
          </Stack>
        </Stack>
      </Stack>
      <Stack
        width={1}
        spacing={2}
        paddingX={2}
        direction={"row"}
        alignItems={"center"}
        boxSizing={"border-box"}
      >
        <Button
          onClick={() => {
            sendAnswer(false);
          }}
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
          Cancel
        </Button>
        <Button
          sx={{
            fontWeight: 700,
            height: 36,
            fontSize: 16,
          }}
          variant={"contained"}
          fullWidth
          type={"submit"}
          onClick={() => {
            sendAnswer(true);
          }}
        >
          Switch
        </Button>
      </Stack>
    </Stack>
  );
};

export default ChangeSelectedChain;
