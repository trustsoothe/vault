import React from "react";
import SendSummary from "./SendSummary";
import Summary from "../components/Summary";
import TransactionHash from "./TransactionHash";
import SuccessActionBanner from "../components/SuccessActionBanner";

export default function SendSubmitted() {
  return (
    <>
      <SuccessActionBanner label={"Transaction Sent"} />
      <SendSummary />
      <Summary
        rows={[
          {
            type: "row",
            label: "Tx. Hash",
            value: <TransactionHash />,
          },
        ]}
      />
    </>
  );
}
