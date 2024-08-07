import React from "react";
import Typography from "@mui/material/Typography";
import { themeColors } from "../theme";

interface InfoProps {
  text: string;
}

export default function Info({ text }: InfoProps) {
  return (
    <Typography
      fontSize={11}
      lineHeight={"16px"}
      borderRadius={"8px"}
      padding={"12px 14px"}
      letterSpacing={"0.2px"}
      bgcolor={themeColors.bgLightGray}
    >
      {text}
    </Typography>
  );
}
