import React from "react";
import Stack from "@mui/material/Stack";
import { useFormContext } from "react-hook-form";
import Typography from "@mui/material/Typography";
import { PocketNetworkFee, SupportedProtocols } from "@soothe/vault";
import { AccountInfoFromAddress } from "../../components/AccountInfo";
import VaultPasswordInput from "../../Transaction/VaultPasswordInput";
import Summary, { SummaryRowItem } from "../../components/Summary";
import SummaryValidator from "../SummaryValidator";
import useUsdPrice from "../../hooks/useUsdPrice";
import CheckInput from "../CheckInput";
import MemoInput from "../MemoInput";
import useGetApp from "../useGetApp";

interface UnstakeAppProps {
  memo?: string;
  canEditMemo?: boolean;
  chainId: string;
  fromAddress: string;
  addTitle?: boolean;
  addValidation?: boolean;
  fee: {
    fee: PocketNetworkFee;
    fetchingFee: boolean;
  };
}

export default function UnstakeApp({
  memo,
  canEditMemo,
  fromAddress,
  chainId,
  addTitle,
  addValidation = true,
  fee,
}: UnstakeAppProps) {
  const { app, isSuccess } = useGetApp(fromAddress, chainId);

  const { coinSymbol } = useUsdPrice({
    protocol: SupportedProtocols.Pocket,
    chainId: chainId,
  });

  const rows: Array<SummaryRowItem> = [
    {
      type: "row",
      label: "App",
      value: (
        <AccountInfoFromAddress
          address={fromAddress}
          protocol={SupportedProtocols.Pocket}
        />
      ),
    },
    {
      type: "divider",
    },
    {
      type: "row",
      label: "Fee",
      value: `${fee.fee?.value || 0} ${coinSymbol}`,
    },
  ];

  if (memo) {
    rows.push({
      type: "row",
      label: "Memo",
      value: memo,
    });
  }

  const summaryComponent = (
    <Stack overflow={"auto"}>
      <Summary rows={rows} />
    </Stack>
  );

  if (!addValidation) {
    return summaryComponent;
  }

  return (
    <>
      {addTitle && (
        <Typography variant={"subtitle2"} textAlign={"center"} marginBottom={1}>
          Are you sure you want to unstake this app?
        </Typography>
      )}

      <SummaryValidator
        fromAddress={fromAddress}
        chainId={chainId}
        customValidation={() => {
          if (!app && !isSuccess) {
            return "Loading...";
          }

          if (!app && isSuccess) {
            return "App not found";
          }

          if (app && app.address !== fromAddress) {
            return "You are not the owner of this app";
          }

          return true;
        }}
      >
        {summaryComponent}
      </SummaryValidator>
      {canEditMemo && <MemoInput />}
      <CheckInput />
      <VaultPasswordInput />
    </>
  );
}

export function UnstakeAppSummaryFromForm({
  addValidation = true,
}: {
  addValidation?: boolean;
}) {
  const { watch } = useFormContext();

  const [chainId, fromAddress, memo, fee, fetchingFee] = watch([
    "chainId",
    "fromAddress",
    "memo",
    "fee",
    "fetchingFee",
  ]);

  return (
    <UnstakeApp
      addTitle={true}
      chainId={chainId}
      canEditMemo={true}
      fromAddress={fromAddress}
      addValidation={addValidation}
      memo={!addValidation ? memo : undefined}
      fee={{
        fee,
        fetchingFee,
      }}
    />
  );
}
