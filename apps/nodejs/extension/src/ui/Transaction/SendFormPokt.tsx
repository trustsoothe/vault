import React from "react";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import DialogContent from "@mui/material/DialogContent";
import RecipientAutocomplete from "./RecipientAutocomplete";
import BalanceLabel from "./BalanceLabel";
import PoktFeeLabel from "./PoktFeeLabel";
import AmountInput from "./AmountInput";

export default function SendFormPokt() {
  return (
    <DialogContent
      sx={{ paddingTop: "24px!important", paddingX: 2.4, paddingBottom: 2 }}
    >
      <RecipientAutocomplete />
      <AmountInput />
      <BalanceLabel marginTop={0.8} />
      <PoktFeeLabel marginTop={0.4} />
      <TextField
        placeholder={"Memo (optional)"}
        sx={{
          marginTop: 1.2,
        }}
      />
      <Typography fontSize={11} marginTop={0.8} lineHeight={"16px"}>
        Don’t put sensitive data here. This will be public in the blockchain.
      </Typography>
    </DialogContent>
  );
}
