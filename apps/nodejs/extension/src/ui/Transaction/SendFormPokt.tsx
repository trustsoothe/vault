import React from "react";
import Typography from "@mui/material/Typography";
import DialogContent from "@mui/material/DialogContent";
import RecipientAutocomplete from "./RecipientAutocomplete";
import MemoInput from "../PoktTransaction/MemoInput";
import BalanceLabel from "./BalanceLabel";
import PoktFeeLabel from "./PoktFeeLabel";
import AmountInput from "./AmountInput";

interface SendFormPoktProps {
  isWrapping?: boolean;
}

export default function SendFormPokt({ isWrapping }: SendFormPoktProps) {
  return (
    <DialogContent
      sx={{ paddingTop: "20px!important", paddingX: 2.4, paddingBottom: 2 }}
    >
      <RecipientAutocomplete />
      {isWrapping && (
        <Typography fontSize={11} marginTop={0.8} lineHeight={"16px"}>
          Send Wrapped POKT to an Ethereum address.
        </Typography>
      )}
      <AmountInput marginTop={isWrapping ? 1.2 : 1.6} />
      <BalanceLabel marginTop={0.8} />
      <PoktFeeLabel marginTop={0.4} />
      {!isWrapping && <MemoInput />}
    </DialogContent>
  );
}
