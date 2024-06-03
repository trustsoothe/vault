import React from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { themeColors } from "../theme";
import { useAppSelector } from "../../hooks/redux";
import CloudIcon from "../assets/img/cloud_icon.svg";
import {
  accountConnectedWithTabSelector,
  tabHasConnectionSelector,
} from "../../redux/selectors/session";

export default function ConnectionStatus() {
  const tabHasConnection = useAppSelector(tabHasConnectionSelector);
  const accountConnectedWithTab = useAppSelector(
    accountConnectedWithTabSelector
  );

  return (
    <Stack
      alignItems={"center"}
      justifyContent={"center"}
      position={"relative"}
    >
      <CloudIcon />
      <Box
        position={"absolute"}
        sx={{
          width: 6,
          height: 6,
          bottom: 6,
          right: -3,
          borderRadius: "50%",
          border: `2px solid ${themeColors.bgLightGray}`,
          backgroundColor:
            tabHasConnection && accountConnectedWithTab
              ? themeColors.success
              : themeColors.gray,
        }}
      />
    </Stack>
  );
}
