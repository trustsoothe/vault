import React from "react";
import Stack, { StackProps } from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import SuccessIcon from "../assets/img/success_icon.svg";
import { themeColors } from "../theme";

interface SuccessActionBannerProps {
  label: React.ReactNode;
  description?: React.ReactNode;
  containerProps?: StackProps;
}

export default function FailedActionBanner({
  label,
  description,
  containerProps,
}: SuccessActionBannerProps) {
  return (
    <Stack
      height={40}
      spacing={1}
      paddingX={1.4}
      paddingY={1.2}
      alignItems={"center"}
      borderRadius={"8px"}
      boxSizing={"border-box"}
      bgcolor={themeColors.warningLight}
      direction={"row"}
      {...containerProps}
      sx={{
        ...containerProps?.sx,
        "& path": {
          fill: themeColors.warning,
        },
      }}
    >
      <SuccessIcon />
      <Stack direction={"row"} alignItems={"center"}>
        {typeof label === "string" ? (
          <Typography variant={"subtitle2"}>{label}</Typography>
        ) : (
          label
        )}
        {description}
      </Stack>
    </Stack>
  );
}
