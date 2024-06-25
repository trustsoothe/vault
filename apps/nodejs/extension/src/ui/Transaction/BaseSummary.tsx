import type { TransactionFormValues } from "./BaseTransaction";
import React from "react";
import Stack from "@mui/material/Stack";
import Skeleton from "@mui/material/Skeleton";
import Typography from "@mui/material/Typography";
import { Controller, useFormContext } from "react-hook-form";
import {
  SerializedAccountReference,
  SupportedProtocols,
} from "@poktscan/vault";
import { symbolOfNetworkSelector } from "../../redux/selectors/network";
import useBalanceAndUsdPrice from "../hooks/useBalanceAndUsdPrice";
import { accountsSelector } from "../../redux/selectors/account";
import { contactsSelector } from "../../redux/selectors/contact";
import useSelectedAsset from "../Home/hooks/useSelectedAsset";
import AccountInfo from "../components/AccountInfo";
import { useAppSelector } from "../../hooks/redux";
import { roundAndSeparate } from "../../utils/ui";
import Summary from "../components/Summary";
import { themeColors } from "../theme";

interface AmountWithUsdProps {
  balance: number;
  usdBalance: number;
  decimals: number;
  symbol: string;
  isLoadingUsdPrice: boolean;
}

function AmountWithUsd({
  balance,
  decimals,
  usdBalance,
  symbol,
  isLoadingUsdPrice,
}: AmountWithUsdProps) {
  return (
    <Stack direction={"row"} alignItems={"center"} spacing={0.5}>
      <Typography noWrap={true} variant={"subtitle2"}>
        {roundAndSeparate(balance, decimals, "0.00")}
      </Typography>
      <Typography variant={"subtitle2"}>{symbol}</Typography>
      {isLoadingUsdPrice ? (
        <Skeleton variant={"rectangular"} width={60} height={16} />
      ) : (
        <Typography color={themeColors.gray}>
          ($ {roundAndSeparate(usdBalance, 2, "0.00")})
        </Typography>
      )}
    </Stack>
  );
}

export default function BaseSummary() {
  const accounts = useAppSelector(accountsSelector);
  const contacts = useAppSelector(contactsSelector);
  const { control, watch } = useFormContext<TransactionFormValues>();

  const [
    fromAddress,
    protocol,
    chainId,
    recipientAddress,
    amount,
    fee,
    txSpeed,
  ] = watch([
    "fromAddress",
    "protocol",
    "chainId",
    "recipientAddress",
    "amount",
    "fee",
    "txSpeed",
  ]);

  const selectedAsset = useSelectedAsset();

  const networkSymbol = useAppSelector(
    symbolOfNetworkSelector(protocol, chainId)
  );
  const { coinSymbol, usdPrice, isLoadingUsdPrice, balance } =
    useBalanceAndUsdPrice({
      address: fromAddress,
      protocol,
      chainId,
      asset: selectedAsset,
    });

  let fromAccount: SerializedAccountReference,
    recipientAccount: SerializedAccountReference;

  for (const account of accounts) {
    if (account.address === fromAddress && account.protocol === protocol) {
      fromAccount = account;
      continue;
    }

    if (account.address === recipientAddress && account.protocol === protocol) {
      recipientAccount = account;
    }
  }

  const recipientContact = contacts.find(
    (contact) =>
      contact.address === recipientAddress && contact.protocol === protocol
  );

  const amountNum = Number(amount);
  const feeOfTx = Number(
    fee.protocol === SupportedProtocols.Pocket ? fee.value : fee[txSpeed].amount
  );
  const total = amountNum + feeOfTx;
  const decimals =
    selectedAsset?.decimals || protocol === SupportedProtocols.Pocket ? 6 : 18;

  return (
    <Controller
      control={control}
      name={"amount"}
      rules={{
        required: "Required",
        validate: () => {
          if (isNaN(amountNum) || isNaN(feeOfTx)) {
            return "Invalid amount";
          }

          const total = amountNum + (selectedAsset ? 0 : feeOfTx);

          return total > balance ? `Insufficient balance` : true;
        },
      }}
      render={({ fieldState: { error } }) => (
        <>
          <Summary
            rows={[
              {
                type: "row",
                label: "From",
                value: (
                  <AccountInfo address={fromAddress} name={fromAccount?.name} />
                ),
              },
              { type: "divider" },
              {
                type: "row",
                label: "To",
                value: (
                  <AccountInfo
                    address={recipientAddress}
                    name={recipientContact?.name || recipientAccount?.name}
                    type={recipientContact ? "contact" : "account"}
                  />
                ),
              },
            ]}
          />
          <Summary
            rows={[
              {
                type: "row",
                label: "Amount",
                value: (
                  <AmountWithUsd
                    symbol={coinSymbol}
                    balance={amountNum}
                    usdBalance={amountNum * usdPrice}
                    isLoadingUsdPrice={isLoadingUsdPrice}
                    decimals={decimals}
                  />
                ),
              },
              {
                type: "row",
                label: "Fee",
                value: (
                  <AmountWithUsd
                    symbol={networkSymbol}
                    balance={feeOfTx}
                    usdBalance={feeOfTx * usdPrice}
                    isLoadingUsdPrice={isLoadingUsdPrice}
                    decimals={decimals}
                  />
                ),
              },
              ...(selectedAsset
                ? []
                : ([
                    {
                      type: "row",
                      label: "Max Total",
                      value: (
                        <AmountWithUsd
                          symbol={coinSymbol}
                          balance={total}
                          usdBalance={total * usdPrice}
                          isLoadingUsdPrice={isLoadingUsdPrice}
                          decimals={decimals}
                        />
                      ),
                    },
                  ] as const)),
            ]}
            containerProps={{
              marginTop: 1.6,
            }}
          />
          {error && (
            <Typography
              fontSize={11}
              marginTop={0.8}
              textAlign={"right"}
              lineHeight={"16px"}
              color={themeColors.red}
            >
              {error.message}
            </Typography>
          )}
        </>
      )}
    ></Controller>
  );
}
