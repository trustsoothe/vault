import React from "react";
import Stack, { StackProps } from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import SuccessIcon from "../assets/img/success_icon.svg";
import { themeColors } from "../theme";

interface SuccessActionBannerProps {
  label: React.ReactNode;
  containerProps?: StackProps;
}

export default function SuccessActionBanner({
  label,
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
      bgcolor={themeColors.successLight}
      direction={"row"}
      {...containerProps}
    >
      <SuccessIcon />
      {typeof label === "string" ? (
        <Typography variant={"subtitle2"}>{label}</Typography>
      ) : (
        label
      )}
    </Stack>
  );
}
