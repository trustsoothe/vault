import React from "react";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import PuzzleIcon from "../assets/img/puzzle_icon.svg";
import GrayContainer from "../components/GrayContainer";
import NewAccountsButtons from "./NewAccountsButtons";
import { themeColors } from "../theme";

export default function NoAccounts() {
  return (
    <>
      <GrayContainer>
        <PuzzleIcon />
        <Typography width={252} marginTop={1.4} textAlign={"center"}>
          You don’t have any accounts yet. Please import or create a new
          account.
        </Typography>
        <Stack
          width={1}
          spacing={1.2}
          marginTop={5}
          paddingX={2.4}
          direction={"row"}
          alignItems={"center"}
          boxSizing={"border-box"}
          sx={{
            button: {
              width: 160,
              height: 37,
              backgroundColor: themeColors.white,
              boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.08)",
            },
          }}
        >
          <NewAccountsButtons />
        </Stack>
      </GrayContainer>
      <Stack flexGrow={1} bgcolor={themeColors.white} />
    </>
  );
}
