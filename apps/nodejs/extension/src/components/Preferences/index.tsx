import React from "react";
import Stack from "@mui/material/Stack";
import Divider from "@mui/material/Divider";
import SessionsMaxAge from "./SessionsMaxAge";
import PasswordForSensitiveOpts from "./PasswordForSensitiveOpts";

const Preferences: React.FC = () => {
  return (
    <Stack paddingTop={1} spacing={1}>
      <SessionsMaxAge />
      <Divider flexItem={true} />
      <PasswordForSensitiveOpts />
    </Stack>
  );
};

export default Preferences;
