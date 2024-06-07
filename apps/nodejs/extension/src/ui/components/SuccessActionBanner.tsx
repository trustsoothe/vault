import React from "react";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import SuccessIcon from "../assets/img/success_icon.svg";
import { themeColors } from "../theme";

interface SuccessActionBannerProps {
  label: string;
}

export default function SuccessActionBanner({
  label,
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
    >
      <SuccessIcon />
      <Typography variant={"subtitle2"}>{label}</Typography>
    </Stack>
  );
}
