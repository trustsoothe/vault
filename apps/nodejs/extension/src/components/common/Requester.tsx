import type { RequestsType } from "../../redux/slices/app";
import { useTheme } from "@mui/material";
import Typography from "@mui/material/Typography";
import React, { useCallback, useEffect, useState } from "react";
import Stack, { StackProps } from "@mui/material/Stack";
import { OriginBlocked } from "../../errors/communication";
import ToggleBlockSite from "../Session/ToggleBlockSite";
import { removeRequestWithRes } from "../../utils/ui";
import { useAppDispatch, useAppSelector } from "../../hooks/redux";
import { HEIGHT, WIDTH } from "../../constants/ui";
import {
  externalRequestsLengthSelector,
  isUnlockedSelector,
} from "../../redux/selectors/session";

interface RequesterProps {
  request: RequestsType;
  text?: string;
  containerProps?: StackProps;
  hideBlock?: boolean;
}

const Requester: React.FC<RequesterProps> = ({
  request,
  text,
  containerProps,
  hideBlock = false,
}) => {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const [blockOriginRequest, setBlockOriginRequest] = useState(false);

  const isUnlocked = useAppSelector(isUnlockedSelector);
  const externalRequestsLength = useAppSelector(externalRequestsLengthSelector);

  useEffect(() => {
    setBlockOriginRequest(false);
  }, [request]);

  const toggleBlockOrigin = useCallback(() => {
    setBlockOriginRequest((prevState) => !prevState);
  }, []);

  const onBlockedSite = useCallback(() => {
    if (request) {
      removeRequestWithRes(
        request,
        OriginBlocked,
        dispatch,
        externalRequestsLength,
        !isUnlocked
      ).catch();
    }
  }, [request, externalRequestsLength, dispatch, isUnlocked]);

  if (blockOriginRequest) {
    return (
      <Stack
        position={"absolute"}
        height={HEIGHT - 111}
        width={WIDTH}
        left={0}
        top={111}
        bgcolor={"white"}
        zIndex={10000}
        paddingX={2}
        boxSizing={"border-box"}
        marginTop={"0px!important"}
      >
        <ToggleBlockSite
          site={request.origin}
          sessionId={"sessionId" in request ? request.sessionId : undefined}
          onBlocked={onBlockedSite}
          onClose={toggleBlockOrigin}
        />
      </Stack>
    );
  }

  return (
    <Stack
      width={1}
      paddingY={1}
      paddingX={1.5}
      borderRadius={"4px"}
      boxSizing={"border-box"}
      border={`1px solid ${theme.customColors.primary250}`}
      {...containerProps}
    >
      <Stack
        direction={"row"}
        height={30}
        alignItems={"center"}
        justifyContent={"space-between"}
      >
        <Typography
          fontWeight={500}
          fontSize={16}
          letterSpacing={"0.5px"}
          color={theme.customColors.dark100}
        >
          {request.origin}
        </Typography>
        {!hideBlock && (
          <Typography
            fontSize={13}
            fontWeight={500}
            sx={{
              cursor: "pointer",
              textDecoration: "underline",
            }}
            onClick={toggleBlockOrigin}
            color={theme.customColors.red100}
          >
            Block
          </Typography>
        )}
      </Stack>
      {text && (
        <Stack
          direction={"row"}
          height={30}
          alignItems={"center"}
          justifyContent={"space-between"}
        >
          <Typography fontSize={14} color={theme.customColors.dark75}>
            {text}
          </Typography>
        </Stack>
      )}
    </Stack>
  );
};

export default Requester;
