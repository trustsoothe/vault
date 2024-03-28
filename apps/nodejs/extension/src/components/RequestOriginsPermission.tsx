import React from "react";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import browser from "webextension-polyfill";
import Typography from "@mui/material/Typography";
import SootheLogoHeader from "./common/SootheLogoHeader";
import { requiredOrigins } from "../constants/permissions";

interface RequestOriginsPermissionProps {
  onGranted: () => void;
}

export default function RequestOriginsPermission({
  onGranted,
}: RequestOriginsPermissionProps) {
  return (
    <Stack alignItems={"center"} flexGrow={1}>
      <SootheLogoHeader
        compact={false}
        containerProps={{
          display: "flex",
        }}
      />
      <Stack
        flexGrow={1}
        alignItems={"center"}
        justifyContent={"center"}
        spacing={2}
      >
        <Typography
          fontSize={14}
          textAlign={"center"}
          paddingX={2}
          marginTop={"-30px!important"}
        >
          Before you are able to use our Vault, you must grant our extension the
          permission to inject our provider to every website to enable the
          communication between websites and our extension and be able to fetch
          the data from the different RPCs and APIs we use.
        </Typography>
        <Button
          id={"request-origins-permission"}
          variant={"contained"}
          ref={(button) => {
            if (button) {
              const listener = async () => {
                const granted = await browser.permissions.request({
                  origins: requiredOrigins,
                });

                if (granted) {
                  onGranted();
                  document
                    .querySelector(`#${button.id}`)
                    .removeEventListener("click", listener);
                }
              };

              document
                .querySelector(`#${button.id}`)
                .addEventListener("click", listener);
            }
          }}
        >
          Grant Permission
        </Button>
      </Stack>
    </Stack>
  );
}
