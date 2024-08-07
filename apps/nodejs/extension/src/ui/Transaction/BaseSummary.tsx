import type { Network } from "../../redux/slices/app";
import type { TransactionFormValues } from "./BaseTransaction";
import React from "react";
import Decimal from "decimal.js";
import Stack from "@mui/material/Stack";
import Skeleton from "@mui/material/Skeleton";
import Typography from "@mui/material/Typography";
import { Controller, useFormContext } from "react-hook-form";
import {
  SerializedAccountReference,
  SupportedProtocols,
} from "@poktscan/vault";
import Summary, { SummaryRowItem } from "../components/Summary";
import { networksSelector } from "../../redux/selectors/network";
import useBalanceAndUsdPrice from "../hooks/useBalanceAndUsdPrice";
import { accountsSelector } from "../../redux/selectors/account";
import { contactsSelector } from "../../redux/selectors/contact";
import useSelectedAsset from "../Home/hooks/useSelectedAsset";
import AccountInfo from "../components/AccountInfo";
import { useAppSelector } from "../hooks/redux";
import { roundAndSeparate } from "../../utils/ui";
import useGetBalance from "../hooks/useGetBalance";
import { themeColors } from "../theme";

interface AmountWithUsdProps {
  balance: number;
  usdBalance: number;
  decimals: number;
  symbol: string;
  isLoadingUsdPrice: boolean;
}

export function AmountWithUsd({
  balance,
  decimals,
  usdBalance,
  symbol,
  isLoadingUsdPrice,
}: AmountWithUsdProps) {
  return (
    <Stack
      direction={"row"}
      alignItems={"center"}
      spacing={0.5}
      justifyContent={"flex-end"}
      maxWidth={200}
    >
      <Typography noWrap={true} variant={"subtitle2"} flexGrow={1} minWidth={0}>
        {roundAndSeparate(new Decimal(balance).toNumber(), decimals, "0.00")}
      </Typography>
      <Typography variant={"subtitle2"}>{symbol}</Typography>
      {isLoadingUsdPrice ? (
        <Skeleton variant={"rectangular"} width={60} height={16} />
      ) : (
        <Typography color={themeColors.gray} whiteSpace={"nowrap"}>
          ($ {roundAndSeparate(usdBalance, 2, "0.00")})
        </Typography>
      )}
    </Stack>
  );
}

export const getNetworkRow = (network: Network): SummaryRowItem => ({
  type: "row",
  label: "Network",
  value: (
    <Stack direction={"row"} alignItems={"center"} spacing={0.7}>
      <img
        width={15}
        height={15}
        src={network.iconUrl}
        alt={`${network.protocol}-${network.chainId}-img`}
      />
      <Typography variant={"subtitle2"}>{network.label}</Typography>
    </Stack>
  ),
});

interface BaseSummaryProps {
  isSwapping?: boolean;
  onlyShowAmount?: boolean;
  hideNetworks?: boolean;
}

export default function BaseSummary({
  isSwapping,
  onlyShowAmount = false,
  hideNetworks = false,
}: BaseSummaryProps) {
  const accounts = useAppSelector(accountsSelector);
  const contacts = useAppSelector(contactsSelector);
  const { control, watch } = useFormContext<TransactionFormValues>();

  const [
    fromAddress,
    protocol,
    chainId,
    recipientAddress,
    recipientProtocol,
    amount,
    fee,
    txSpeed,
  ] = watch([
    "fromAddress",
    "protocol",
    "chainId",
    "recipientAddress",
    "recipientProtocol",
    "amount",
    "fee",
    "txSpeed",
  ]);

  const selectedAsset = useSelectedAsset();

  const networks = useAppSelector(networksSelector);
  const network = networks.find(
    (network) => network.protocol === protocol && network.chainId === chainId
  );
  const networkSymbol = network.currencySymbol;

  const isPokt = protocol === SupportedProtocols.Pocket;
  const toNetwork =
    isSwapping && (isPokt || selectedAsset?.symbol === "WPOKT")
      ? networks.find(
          (network) =>
            network.protocol ===
              (isPokt
                ? SupportedProtocols.Ethereum
                : SupportedProtocols.Pocket) &&
            network.chainId ===
              (isPokt
                ? chainId === "mainnet"
                  ? "1"
                  : "5"
                : chainId === "1"
                ? "mainnet"
                : "testnet")
        )
      : undefined;

  const { coinSymbol, usdPrice, isLoadingUsdPrice, balance } =
    useBalanceAndUsdPrice({
      address: fromAddress,
      protocol,
      chainId,
      asset: selectedAsset,
    });

  const { balance: nativeBalance } = useGetBalance({
    address: fromAddress,
    protocol,
    chainId,
  });

  let fromAccount: SerializedAccountReference,
    recipientAccount: SerializedAccountReference;

  for (const account of accounts) {
    if (account.address === fromAddress && account.protocol === protocol) {
      fromAccount = account;
      continue;
    }

    if (
      account.address === recipientAddress &&
      account.protocol === (recipientProtocol || protocol)
    ) {
      recipientAccount = account;
    }
  }

  const recipientContact = contacts.find(
    (contact) =>
      contact.address === recipientAddress &&
      contact.protocol === (recipientProtocol || protocol)
  );

  const amountNum = Number(amount);
  const feeOfTx = Number(
    fee
      ? fee.protocol === SupportedProtocols.Pocket
        ? fee.value
        : fee[txSpeed]?.amount || 0
      : 0
  );
  const total = new Decimal(amountNum).add(new Decimal(feeOfTx)).toNumber();
  const decimals =
    selectedAsset?.decimals || protocol === SupportedProtocols.Pocket ? 6 : 18;

  const firstSummaryRows: Array<SummaryRowItem> = [
    {
      type: "row",
      label: "From",
      value: <AccountInfo address={fromAddress} name={fromAccount?.name} />,
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
  ];

  if (!hideNetworks) {
    if (isSwapping) {
      firstSummaryRows.splice(1, 0, getNetworkRow(network));
      firstSummaryRows.splice(4, 0, getNetworkRow(toNetwork));
    } else if (!onlyShowAmount) {
      firstSummaryRows.push({ type: "divider" }, getNetworkRow(network));
    }
  }

  const coinsSummaryRows: Array<SummaryRowItem> = [
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
  ];

  if (!onlyShowAmount) {
    coinsSummaryRows.push({
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
    });

    if (!selectedAsset) {
      coinsSummaryRows.push({
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
      });
    }
  }

  return (
    <Controller
      control={control}
      name={"amount"}
      rules={{
        required: "Required",
        validate: () => {
          if (isNaN(amountNum) || isNaN(feeOfTx) || isNaN(nativeBalance)) {
            return "";
          }

          if (selectedAsset) {
            if (amountNum > balance || feeOfTx > nativeBalance) {
              return "Insufficient balance";
            }
          } else {
            if (amountNum + feeOfTx > balance) {
              return "Insufficient balance";
            }
          }

          return true;
        },
      }}
      render={({ fieldState: { error } }) => (
        <>
          <Summary rows={firstSummaryRows} />
          <Summary
            rows={coinsSummaryRows}
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
