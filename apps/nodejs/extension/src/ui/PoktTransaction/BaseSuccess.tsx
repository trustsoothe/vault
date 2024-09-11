import React from "react";
import Summary from "../components/Summary";
import TransactionHash from "../Transaction/TransactionHash";
import SuccessActionBanner from "../components/SuccessActionBanner";

export default function BaseSuccess({ children }: React.PropsWithChildren) {
  return (
    <>
      <SuccessActionBanner
        label={"Transaction Sent"}
        containerProps={{ marginBottom: 1.6 }}
      />
      {children}
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
    </>
  );
}
