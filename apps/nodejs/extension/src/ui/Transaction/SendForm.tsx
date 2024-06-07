import React from "react";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import TextFieldWithPaste from "../components/TextFieldWithPaste";
import { themeColors } from "../theme";

export default function SendForm() {
  return (
    <>
      <TextField type={"number"} placeholder={"Amount (POKT)"} required />
      <Stack
        marginTop={0.8}
        direction={"row"}
        alignItems={"center"}
        justifyContent={"space-between"}
      >
        <Typography variant={"body2"} color={themeColors.textSecondary}>
          Balance
        </Typography>
        <Typography variant={"body2"} color={themeColors.textSecondary}>
          286.39 POKT
        </Typography>
      </Stack>
      <Stack
        marginTop={0.4}
        direction={"row"}
        alignItems={"center"}
        justifyContent={"space-between"}
      >
        <Typography variant={"body2"} color={themeColors.textSecondary}>
          Fee
        </Typography>
        <Typography variant={"body2"} color={themeColors.textSecondary}>
          0.01 POKT
        </Typography>
      </Stack>

      <TextFieldWithPaste
        placeholder={"Public Address"}
        onPaste={console.log}
        required
        sx={{
          marginTop: 2,
        }}
      />

      <TextField placeholder={"Memo (optional)"} sx={{ marginTop: 1.6 }} />
      <Typography
        marginTop={0.8}
        variant={"body2"}
        color={themeColors.textSecondary}
      >
        Don’t put sensitive data here. This will be public in the blockchain.
      </Typography>
    </>
  );
}
