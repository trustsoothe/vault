import Stack from "@mui/material/Stack";
import browser from "webextension-polyfill";
import React, { useRef, useState } from "react";
import Typography from "@mui/material/Typography";
import { requiredOrigins } from "../../constants/permissions";
import LoadingButton from "../components/LoadingButton";
import { HEIGHT, WIDTH } from "../../constants/ui";
import Logo from "../assets/logo/isologo.svg";
import { themeColors } from "../theme";

interface RequestOriginsPermissionProps {
  onGranted: () => void;
}

export default function RequestOriginsPermission({
  onGranted,
}: RequestOriginsPermissionProps) {
  const [isLoading, setIsLoading] = useState(false);
  const wasNotified = useRef<boolean>(false);

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
        Website Permissions
      </Typography>
      <Typography marginTop={1.4} textAlign={"center"}>
        Before you’re able to use your vault, you must grant Soothe the
        permission to inject our provider to every website to enable
        communication between websites and Soothe and to allow us to fetch data
        from the different RPCs and APIs we use.
      </Typography>

      <LoadingButton
        id={"request-origins-permission"}
        variant={"contained"}
        fullWidth
        ref={(button) => {
          if (button) {
            const listener = async () => {
              if (wasNotified.current) return;
              wasNotified.current = true;
              setIsLoading(true);

              const granted = await browser.permissions.request({
                origins: requiredOrigins,
              });

              wasNotified.current = false;

              if (granted) {
                onGranted();
                document
                  .querySelector(`#${button.id}`)
                  .removeEventListener("click", listener);
              }
              setIsLoading(false);
            };

            document
              .querySelector(`#${button.id}`)
              .addEventListener("click", listener);
          }
        }}
        sx={{
          marginTop: 3.5,
        }}
        isLoading={isLoading}
      >
        Grant Permission
      </LoadingButton>
    </Stack>
  );
}
