import React from "react";
import DialogContent from "@mui/material/DialogContent";
import SuccessActionBanner from "../components/SuccessActionBanner";
import TransactionHash from "./TransactionHash";
import Summary from "../components/Summary";
import BaseSummary from "./BaseSummary";

interface SubmittedProps {
  isSwapping?: boolean;
}

export default function Submitted({ isSwapping }: SubmittedProps) {
  return (
    <DialogContent sx={{ padding: "20px!important" }}>
      <SuccessActionBanner
        label={"Transaction Sent"}
        containerProps={{ marginBottom: 1.6 }}
      />
      <BaseSummary isSwapping={isSwapping} />
      <Summary
        containerProps={{ marginTop: 1.6 }}
        rows={[
          {
            type: "row",
            label: "Tx. Hash",
            value: <TransactionHash />,
          },
        ]}
      />
    </DialogContent>
  );
}
