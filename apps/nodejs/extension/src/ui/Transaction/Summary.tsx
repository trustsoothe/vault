import React from "react";
import DialogContent from "@mui/material/DialogContent";
import VaultPasswordInput from "./VaultPasswordInput";
import BaseSummary from "./BaseSummary";

interface SummaryProps {
  isSwapping?: boolean;
}

export default function Summary({ isSwapping }: SummaryProps) {
  return (
    <DialogContent sx={{ padding: "20px!important" }}>
      <BaseSummary isSwapping={isSwapping} />
      <VaultPasswordInput />
    </DialogContent>
  );
}
