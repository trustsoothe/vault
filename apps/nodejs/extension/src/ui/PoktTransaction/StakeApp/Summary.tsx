import React from "react";
import Stack from "@mui/material/Stack";
import { useFormContext } from "react-hook-form";
import { PocketNetworkFee, SupportedProtocols } from "@soothe/vault";
import VaultPasswordInput from "../../Transaction/VaultPasswordInput";
import { AmountWithUsd } from "../../Transaction/BaseSummary";
import SummaryValidator from "../SummaryValidator";
import useUsdPrice from "../../hooks/useUsdPrice";
import Summary, { SummaryProps } from "../../components/Summary";
import ChainsSummary from "../ChainsSummary";
import CheckInput from "../CheckInput";
import useGetApp from "../useGetApp";

interface StakeAppSummaryProps {
  appAddress: string;
  chainId: string;
  memo?: string;
  amount: number;
  chains: string[];
  fee: {
    fee: PocketNetworkFee;
    fetchingFee: boolean;
  };
  addValidation?: boolean;
  hidePasswordInput?: boolean;
  avoidFeeChecking?: boolean;
}

export default function StakeAppSummary({
  appAddress,
  fee,
  amount,
  chainId,
  chains,
  memo,
  addValidation = true,
  hidePasswordInput = false,
  avoidFeeChecking = false,
}: StakeAppSummaryProps): JSX.Element {
  const { coinSymbol, usdPrice, isLoading } = useUsdPrice({
    protocol: SupportedProtocols.Pocket,
    chainId,
  });
  const { app, isSuccess } = useGetApp(appAddress, chainId);

  const summaryRows: SummaryProps["rows"] = [
    {
      type: "row",
      label: "Stake Amount",
      value: (
        <AmountWithUsd
          balance={amount}
          decimals={6}
          symbol={coinSymbol}
          usdBalance={usdPrice * amount}
          isLoadingUsdPrice={isLoading}
        />
      ),
    },
  ];

  if (fee) {
    summaryRows.push({
      type: "row",
      label: "Fee",
      value: `${fee.fee?.value || 0} ${coinSymbol}`,
    });
  }

  const summaryComponent = (
    <Stack overflow={"auto"}>
      <Summary rows={summaryRows} />
      <ChainsSummary chains={chains} chainId={chainId} />
      {memo && (
        <Summary
          containerProps={{
            paddingTop: 0,
            marginTop: -0.6,
          }}
          rows={[
            {
              type: "row",
              label: "Memo",
              value: memo,
            },
          ]}
        />
      )}
    </Stack>
  );

  return !addValidation ? (
    summaryComponent
  ) : (
    <>
      <SummaryValidator
        avoidFeeChecking={avoidFeeChecking}
        fromAddress={appAddress}
        chainId={chainId}
        amount={amount - Number(app?.staked_tokens || 0) / 1e6}
        customValidation={() => {
          if (!app && !isSuccess) {
            return "Loading app...";
          }

          if (app && app.address !== appAddress) {
            return "You are not allowed to stake to this app";
          }

          return true;
        }}
      >
        {summaryComponent}
      </SummaryValidator>
      {!hidePasswordInput && (
        <>
          <CheckInput />
          <VaultPasswordInput />
        </>
      )}
    </>
  );
}

export function StakeAppSummaryFromForm({
  addValidation = true,
}: {
  addValidation?: boolean;
}) {
  const { watch } = useFormContext();

  const [amount, chainId, chains, fee, fromAddress, fetchingFee, memo] = watch([
    "amount",
    "chainId",
    "chains",
    "fee",
    "fromAddress",
    "fetchingFee",
    "memo",
  ]);

  return (
    <StakeAppSummary
      amount={Number(amount)}
      chainId={chainId}
      chains={chains}
      fee={{
        fee,
        fetchingFee,
      }}
      appAddress={fromAddress}
      memo={memo}
      addValidation={addValidation}
    />
  );
}
