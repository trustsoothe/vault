import React from "react";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import WarningIcon from "../assets/img/rounded_close_icon.svg";
import CheckWarningIcon from "../assets/img/check_warning_icon.svg";
import { themeColors } from "../theme";

interface WarningActionBannerProps {
  label: React.ReactNode;
  withCheckIcon?: boolean;
}

export default function WarningActionBanner({
  label,
  withCheckIcon = false,
}: WarningActionBannerProps) {
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
    >
      {withCheckIcon ? <CheckWarningIcon /> : <WarningIcon />}
      {typeof label === "string" ? (
        <Typography variant={"subtitle2"}>{label}</Typography>
      ) : (
        label
      )}
    </Stack>
  );
}
