import React from "react";
import Typography from "@mui/material/Typography";
import DialogContent from "@mui/material/DialogContent";
import RecipientAutocomplete from "./RecipientAutocomplete";
import BalanceLabel from "./BalanceLabel";
import EthFeeSelect from "./EthFeeSelect";
import AmountInput from "./AmountInput";

interface SendFormEthProps {
  asset?: {
    contractAddress: string;
    decimals: number;
  };
}

export default function SendFormEth({ asset }: SendFormEthProps) {
  return (
    <DialogContent
      sx={{ paddingTop: "24px!important", paddingX: 2.4, paddingBottom: 2 }}
    >
      <RecipientAutocomplete />
      <Typography fontSize={11} marginTop={0.8} lineHeight={"16px"}>
        Address is required to retrieve network fees.
      </Typography>
      <AmountInput asset={asset} marginTop={1.2} />
      <BalanceLabel marginTop={0.8} asset={asset} />
      <EthFeeSelect />
    </DialogContent>
  );
}
