import React from "react";
import Typography from "@mui/material/Typography";
import DialogContent from "@mui/material/DialogContent";
import RecipientAutocomplete from "./RecipientAutocomplete";
import BalanceLabel from "./BalanceLabel";
import EthFeeSelect from "./EthFeeSelect";
import AmountInput from "./AmountInput";

interface SendFormEthProps {
  isUnwrapping?: boolean;
}

export default function SendFormEth({ isUnwrapping }) {
  return (
    <DialogContent
      sx={{ paddingTop: "20px!important", paddingX: 2.4, paddingBottom: 2 }}
    >
      <RecipientAutocomplete />
      <Typography fontSize={11} marginTop={0.8} lineHeight={"16px"}>
        {isUnwrapping
          ? "Unwrap WPOKT and send POKT a Pocket Network address."
          : "Address is required to retrieve network fees."}
      </Typography>
      <AmountInput marginTop={1.2} />
      <BalanceLabel marginTop={0.8} />
      <EthFeeSelect isUnwrapping={isUnwrapping} />
    </DialogContent>
  );
}
