import React from "react";
import Stack from "@mui/material/Stack";
import browser from "webextension-polyfill";
import Typography from "@mui/material/Typography";
import { APP_IS_READY_REQUEST } from "../../constants/communication";
import LoadingButton from "../components/LoadingButton";
import { HEIGHT, WIDTH } from "../../constants/ui";
import { useAppSelector } from "../../hooks/redux";
import Logo from "../assets/logo/isologo.svg";
import { themeColors } from "../theme";

export default function AppInitError() {
  const appStatus = useAppSelector((state) => state.app.isReadyStatus);
  const retryInitExtension = () => {
    browser.runtime.sendMessage({ type: APP_IS_READY_REQUEST }).catch();
  };

  const isLoading = appStatus === "loading";

  return (
    <Stack
      width={WIDTH}
      paddingX={2.4}
      height={HEIGHT}
      paddingTop={4.8}
      alignItems={"center"}
      boxSizing={"border-box"}
      bgcolor={themeColors.bgLightGray}
    >
      <Logo />
      <Typography fontSize={17} color={themeColors.black} marginTop={2.7}>
        Extension Initialization Failed
      </Typography>
      <Typography marginTop={1.4} textAlign={"center"}>
        There was an error trying to initialize the extension. Please try again
        by clicking the Retry button. If the error persists contact us.
      </Typography>

      <LoadingButton
        variant={"contained"}
        isLoading={isLoading}
        fullWidth
        sx={{
          marginTop: 3.5,
        }}
        onClick={retryInitExtension}
      >
        Retry
      </LoadingButton>
    </Stack>
  );
}
