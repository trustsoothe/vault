import React from "react";
import Stack from "@mui/material/Stack";
import { themeColors } from "../theme";
import KeepSessionActive from "./KeepSessionActive/KeepSessionActive";
import ProtectSensitiveOperations from "./ProtectSensitiveOperations";

export default function Preferences() {
  return (
    <Stack
      flexGrow={1}
      padding={2.4}
      spacing={1.6}
      boxSizing={"border-box"}
      bgcolor={themeColors.white}
    >
      <KeepSessionActive />
      <ProtectSensitiveOperations />
    </Stack>
  );
}
