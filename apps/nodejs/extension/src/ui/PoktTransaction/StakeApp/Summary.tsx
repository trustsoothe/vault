import React from "react";
import Stack from "@mui/material/Stack";
import { useFormContext } from "react-hook-form";
import { PocketNetworkFee, SupportedProtocols } from "@poktscan/vault";
import VaultPasswordInput from "../../Transaction/VaultPasswordInput";
import { AmountWithUsd } from "../../Transaction/BaseSummary";
import SummaryValidator from "../SummaryValidator";
import useUsdPrice from "../../hooks/useUsdPrice";
import Summary from "../../components/Summary";
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
}

export default function StakeAppSummary({
  appAddress,
  fee,
  amount,
  chainId,
  chains,
  memo,
  addValidation = true,
}: StakeAppSummaryProps): JSX.Element {
  const { coinSymbol, usdPrice, isLoading } = useUsdPrice({
    protocol: SupportedProtocols.Pocket,
    chainId,
  });
  const { app, isSuccess } = useGetApp(appAddress, chainId);

  const summaryComponent = (
    <Stack overflow={"auto"}>
      <Summary
        rows={[
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
          {
            type: "row",
            label: "Fee",
            value: `${fee.fee?.value || 0} ${coinSymbol}`,
          },
        ]}
      />
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
      <CheckInput />
      <VaultPasswordInput />
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
