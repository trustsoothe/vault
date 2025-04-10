import React from "react";
import Stack from "@mui/material/Stack";
import { useFormContext } from "react-hook-form";
import { PocketNetworkFee, SupportedProtocols } from "@soothe/vault";
import VaultPasswordInput from "../../Transaction/VaultPasswordInput";
import { AccountInfoFromAddress } from "../../components/AccountInfo";
import Summary, { SummaryRowItem } from "../../components/Summary";
import { AmountWithUsd } from "../../Transaction/BaseSummary";
import SummaryValidator from "../SummaryValidator";
import useUsdPrice from "../../hooks/useUsdPrice";
import useGetAllParams from "../useGetAllParams";
import CheckInput from "../CheckInput";

interface DaoTransferSummaryProps {
  to?: string;
  amount: number;
  daoAction: string;
  chainId: string;
  fromAddress: string;
  fee: {
    fee: PocketNetworkFee;
    fetchingFee: boolean;
  };
  memo?: string;
  addValidation?: boolean;
  hidePasswordInput?: boolean;
  avoidFeeChecking?: boolean;
}

export default function DaoTransferSummary({
  amount,
  daoAction,
  fromAddress,
  fee,
  memo,
  to,
  chainId,
  addValidation = true,
  hidePasswordInput = false,
  avoidFeeChecking = false,
}: DaoTransferSummaryProps) {
  const { coinSymbol, usdPrice, isLoading } = useUsdPrice({
    protocol: SupportedProtocols.Pocket,
    chainId,
  });

  const { allParams: params } = useGetAllParams(chainId);

  const rows: Array<SummaryRowItem> = [
    {
      type: "row",
      label: "From",
      value: (
        <AccountInfoFromAddress
          address={fromAddress}
          protocol={SupportedProtocols.Pocket}
        />
      ),
    },
  ];

  if (daoAction === "dao_transfer") {
    rows.push({
      type: "row",
      label: "To",
      value: (
        <AccountInfoFromAddress
          address={to}
          protocol={SupportedProtocols.Pocket}
        />
      ),
    });
  }

  rows.push(
    {
      type: "row",
      label: "DAO Action",
      value: daoAction,
    },
    {
      type: "row",
      label: "Amount",
      value: (
        <AmountWithUsd
          balance={amount}
          decimals={6}
          symbol={coinSymbol}
          usdBalance={amount * usdPrice}
          isLoadingUsdPrice={isLoading}
        />
      ),
    }
  );

  if (fee) {
    rows.push({
      type: "row",
      label: "Fee",
      value: `${fee.fee?.value || 0} ${coinSymbol}`,
    });
  }

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
        avoidFeeChecking={avoidFeeChecking}
        fromAddress={fromAddress}
        chainId={chainId}
        customValidation={() => {
          if (!params) {
            return "Loading params from blockchain...";
          }

          const daoOwner = params.gov_params.find(
            (param) => param.param_key === "gov/daoOwner"
          )?.param_value;

          if (!daoOwner) {
            return "Cannot validate your account as the DAO owner";
          }

          if (fromAddress !== daoOwner) {
            return "You are not authorized to perform this action";
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

export function DaoTransferSummaryFromForm({
  addValidation = true,
}: {
  addValidation?: boolean;
}) {
  const { watch } = useFormContext();

  const [amount, chainId, daoAction, fee, fromAddress, memo, to, fetchingFee] =
    watch([
      "amount",
      "chainId",
      "daoAction",
      "fee",
      "fromAddress",
      "memo",
      "recipientAddress",
      "fetchingFee",
    ]);

  return (
    <DaoTransferSummary
      amount={Number(amount)}
      daoAction={daoAction}
      fromAddress={fromAddress}
      fee={{
        fee,
        fetchingFee,
      }}
      memo={memo}
      to={to}
      chainId={chainId}
      addValidation={addValidation}
    />
  );
}
