import Stack from "@mui/material/Stack";
import { useFormContext } from "react-hook-form";
import React, { useEffect, useState } from "react";
import { PocketNetworkFee, SupportedProtocols } from "@soothe/vault";
import { AccountInfoFromAddress } from "../../components/AccountInfo";
import VaultPasswordInput from "../../Transaction/VaultPasswordInput";
import Summary, { SummaryRowItem } from "../../components/Summary";
import {
  getAddressFromPublicKey,
  isValidAddress,
} from "../../../utils/networkOperations";
import SummaryValidator from "../SummaryValidator";
import useUsdPrice from "../../hooks/useUsdPrice";
import CheckInput from "../CheckInput";
import useGetApp from "../useGetApp";

interface TransferAppSummaryProps {
  chainId: string;
  appAddress: string;
  newAppPublicKey?: string;
  newAppAddress?: string;
  memo?: string;
  fee: {
    fee: PocketNetworkFee;
    fetchingFee: boolean;
  };
  addValidation?: boolean;
}

export default function TransferAppSummary({
  appAddress,
  newAppPublicKey,
  newAppAddress: newAppAddressFromProps,
  fee,
  chainId,
  memo,
  addValidation = true,
}: TransferAppSummaryProps) {
  const { coinSymbol } = useUsdPrice({
    protocol: SupportedProtocols.Pocket,
    chainId,
  });

  const [newAppAddress, setNewAppAddress] = useState(
    newAppAddressFromProps || ""
  );

  const { app, isSuccess } = useGetApp(appAddress, chainId);

  useEffect(() => {
    if (newAppPublicKey) {
      getAddressFromPublicKey(newAppPublicKey).then(setNewAppAddress);
    }
  }, [newAppPublicKey]);

  const rows: Array<SummaryRowItem> = [
    {
      type: "row",
      label: "Transfer From",
      value: (
        <AccountInfoFromAddress
          address={appAddress}
          protocol={SupportedProtocols.Pocket}
        />
      ),
    },
    {
      type: "row",
      label: "Transfer To",
      value: (
        <AccountInfoFromAddress
          address={newAppAddress}
          protocol={SupportedProtocols.Pocket}
        />
      ),
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

  return !addValidation ? (
    summaryComponent
  ) : (
    <>
      <SummaryValidator
        fromAddress={appAddress}
        chainId={chainId}
        customValidation={() => {
          if (!app && !isSuccess) {
            return "Loading app...";
          }

          if (!app) {
            return "App not found";
          }

          if (appAddress === newAppAddress) {
            return "Cannot transfer to the same address";
          }

          return true;
        }}
      >
        {summaryComponent}
      </SummaryValidator>
      <CheckInput />
      <VaultPasswordInput />
    </>
  );
}

export function TransferAppSummaryFromForm({
  addValidation = true,
}: {
  addValidation?: boolean;
}) {
  const { watch } = useFormContext();

  const [chainId, fee, fromAddress, newAppPublicKey, fetchingFee, memo] = watch(
    ["chainId", "fee", "fromAddress", "newAppPublicKey", "fetchingFee", "memo"]
  );

  const newAppAddress = isValidAddress(
    newAppPublicKey,
    SupportedProtocols.Pocket
  )
    ? newAppPublicKey
    : undefined;

  return (
    <TransferAppSummary
      appAddress={fromAddress}
      newAppAddress={newAppAddress}
      newAppPublicKey={!newAppAddress ? newAppPublicKey : undefined}
      chainId={chainId}
      fee={{
        fee,
        fetchingFee,
      }}
      memo={memo}
      addValidation={addValidation}
    />
  );
}
