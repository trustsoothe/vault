import React from "react";
import DialogContent from "@mui/material/DialogContent";
import SuccessActionBanner from "../components/SuccessActionBanner";
import TransactionHash from "./TransactionHash";
import AddContactButton from "./AddContact";
import Summary, { SummaryRowItem } from "../components/Summary";
import BaseSummary from "./BaseSummary";
import { useFormContext } from "react-hook-form";
import type { TransactionFormValues } from "./BaseTransaction";
import { TransactionStatus } from "../../controllers/datasource/Transaction";
import FailedActionBanner from "../components/FailedActionBanner";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import { themeColors } from "../theme";

interface SubmittedProps {
  isSwapping?: boolean;
  onCancel?: () => void;
}

export default function Submitted({ isSwapping, onCancel }: SubmittedProps) {
  const { watch } = useFormContext<TransactionFormValues>();
  const [txResponse] = watch(["txResponse"]);

  let actionBanner: React.ReactNode;

  if (txResponse?.status === TransactionStatus.Successful) {
    actionBanner = (
      <SuccessActionBanner
        label={"Transaction Sent"}
        containerProps={{ marginBottom: 1.6 }}
      />
    );
  } else {
    actionBanner = (
      <FailedActionBanner
        containerProps={{ marginBottom: 1.6 }}
        label={"Transaction Sent with Errors"}
      />
    );
  }

  const txSummaryItems: Array<SummaryRowItem> = [
    {
      type: "row",
      label: "Tx. Hash",
      value: <TransactionHash />,
    },
  ];

  const details = txResponse?.details as {
    hash: string;
    rpcUrl: string;
    code: number;
    codespace?: string;
    log?: string;
  };

  if (txResponse?.status === TransactionStatus.Invalid) {
    txSummaryItems.push({
      type: "row",
      label: "Code",
      value: details?.code?.toString() || "0",
    });

    if (details?.codespace) {
      txSummaryItems.push({
        type: "row",
        label: "Codespace",
        value: details?.codespace || "0",
      });
    }

    if (details?.log) {
      txSummaryItems.push({
        type: "row",
        label: "Raw Log",
        containerProps: {
          sx: {
            alignItems: "flex-start",
          },
        },
        value: (
          <Stack width={1} marginLeft={-9} marginTop={2.8}>
            <Typography
              fontSize={11}
              marginLeft={0.6}
              color={themeColors.black}
            >
              {details?.log}
            </Typography>
          </Stack>
        ),
      });
    }
  }

  return (
    <DialogContent sx={{ padding: "20px!important" }}>
      {actionBanner}
      <BaseSummary isSwapping={isSwapping} />
      <Summary containerProps={{ marginTop: 1.6 }} rows={txSummaryItems} />
      <AddContactButton onCancel={onCancel} />
    </DialogContent>
  );
}
