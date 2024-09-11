import type { TransactionFormValues } from "./BaseTransaction";
import React from "react";
import Decimal from "decimal.js";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import { Controller, useFormContext } from "react-hook-form";
import {
  EthereumNetworkFee,
  PocketNetworkFee,
  SupportedProtocols,
} from "@poktscan/vault";
import useBalanceAndUsdPrice from "../hooks/useBalanceAndUsdPrice";
import { isValidAddress } from "../../utils/networkOperations";
import useSelectedAsset from "../Home/hooks/useSelectedAsset";

interface AmountInputProps {
  marginTop?: string | number;
  label?: string;
  minAmount?: number;
  amountToReduce?: number;
  disableInput?: boolean;
  amountToSumOnMax?: number;
}

export default function AmountInput({
  marginTop = 1.6,
  label = "Amount",
  minAmount,
  amountToReduce = 0,
  amountToSumOnMax = 0,
  disableInput: disableInputFromProps,
}: AmountInputProps) {
  const asset = useSelectedAsset();
  const { watch, setValue, clearErrors, getValues, control } =
    useFormContext<TransactionFormValues>();
  const [fromAddress, protocol, chainId, recipientAddress, networkFee] = watch([
    "fromAddress",
    "protocol",
    "chainId",
    "recipientAddress",
    "fee",
  ]);

  const { isLoadingBalance, balance, coinSymbol } = useBalanceAndUsdPrice({
    address: fromAddress,
    protocol,
    chainId,
    asset,
  });

  const disableInput =
    disableInputFromProps ||
    (!balance && isLoadingBalance) ||
    (protocol === SupportedProtocols.Ethereum &&
      !isValidAddress(recipientAddress, protocol)) ||
    !networkFee;

  const onClickAll = () => {
    if (disableInput) return;

    const networkFee = getValues("fee");
    const txSpeed = getValues("txSpeed");
    const protocol = getValues("protocol");

    if (!networkFee) return;
    if (!balance) {
      setValue("amount", "0");
      return;
    }

    let fee: number;

    if (protocol === SupportedProtocols.Ethereum) {
      fee = Number((networkFee as EthereumNetworkFee)?.[txSpeed]?.amount || 0);
    } else {
      fee = (networkFee as PocketNetworkFee)?.value || 0;
    }

    const transferFromBalance = asset
      ? balance
      : new Decimal(balance)
          .add(new Decimal(amountToSumOnMax))
          .minus(new Decimal(fee))
          .toNumber();

    if (transferFromBalance) {
      setValue("amount", (transferFromBalance || "").toString());
      clearErrors("amount");
    }
  };

  return (
    <Controller
      control={control}
      name={"amount"}
      rules={{
        required: "Required",
        validate: (value, formValues) => {
          const amountFromInput = Number(value);

          if (minAmount && amountFromInput < minAmount) {
            return `Min allowed is ${minAmount} ${coinSymbol}`;
          }

          if (!formValues.fee || (isLoadingBalance && !balance)) return "";

          const fee = Number(
            formValues.fee.protocol === SupportedProtocols.Pocket
              ? formValues.fee.value
              : formValues.fee[formValues.txSpeed].amount
          );

          if (isNaN(amountFromInput) || isNaN(fee)) {
            return "Invalid amount";
          }

          if (amountFromInput < 0) {
            return `Min is 0`;
          }

          const decimals = asset
            ? asset.decimals
            : protocol === SupportedProtocols.Ethereum
            ? 18
            : 6;

          const total = new Decimal(amountFromInput)
            .add(new Decimal(asset ? 0 : fee))
            .minus(new Decimal(amountToReduce))
            .toDecimalPlaces(decimals);

          return total.gt(new Decimal(balance).toDecimalPlaces(decimals))
            ? "Insufficient balance"
            : true;
        },
      }}
      render={({ field, fieldState: { error } }) => (
        <TextField
          placeholder={`${label} (${coinSymbol})`}
          required
          fullWidth
          size={"small"}
          type={"number"}
          disabled={disableInput}
          sx={{
            marginTop,
            marginBottom: error ? 1 : undefined,
            "& input[type=number]": {
              "&::-webkit-outer-spin-button, &::-webkit-inner-spin-button": {
                WebkitAppearance: "none",
                margin: 0,
              },
              MozAppearance: "textfield",
            },
            "& .MuiFormHelperText-root": {
              marginLeft: 0,
              fontSize: 11,
              marginTop: 0.1,
            },
          }}
          InputProps={{
            endAdornment: (
              <Button
                onClick={onClickAll}
                disabled={disableInput}
                variant={"text"}
                sx={{
                  marginRight: -0.8,
                  minWidth: 0,
                  paddingX: 1.2,
                  height: 28,
                }}
              >
                Max
              </Button>
            ),
          }}
          error={!!error?.message}
          helperText={error?.message}
          {...field}
        />
      )}
    />
  );
}
