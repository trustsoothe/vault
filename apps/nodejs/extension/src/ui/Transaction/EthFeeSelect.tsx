import { EthereumNetworkFee, SupportedProtocols } from "@poktscan/vault";
import type { TransactionFormValues } from "./BaseTransaction";
import React from "react";
import Stack from "@mui/material/Stack";
import Skeleton from "@mui/material/Skeleton";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { Controller, useFormContext } from "react-hook-form";
import { symbolOfNetworkSelector } from "../../redux/selectors/network";
import SelectedIcon from "../assets/img/check_icon.svg";
import { roundAndSeparate } from "../../utils/ui";
import { useAppSelector } from "../hooks/redux";
import useUsdPrice from "../hooks/useUsdPrice";
import BalanceLabel from "./BalanceLabel";
import { themeColors } from "../theme";

interface EthFeeSelectProps {
  marginTop?: number | string;
  isUnwrapping?: boolean;
}

export default function EthFeeSelect({
  marginTop = 1.2,
  isUnwrapping,
}: EthFeeSelectProps) {
  const { control, watch } = useFormContext<TransactionFormValues>();
  const [fee, fetchingFee, protocol, chainId, txSpeed] = watch([
    "fee",
    "fetchingFee",
    "protocol",
    "chainId",
    "txSpeed",
  ]);

  const networkSymbol = useAppSelector(
    symbolOfNetworkSelector(protocol, chainId)
  );
  const { usdPrice } = useUsdPrice({
    protocol,
    chainId,
  });

  const feeOptions = [
    {
      value: "low",
      label: "Low",
      subLabel: "(1 min.)",
    },
    {
      value: "medium",
      label: "Medium",
      subLabel: "(30 secs.)",
    },
    {
      value: "high",
      label: "High",
      subLabel: "(15 secs.)",
    },
  ];

  if (
    txSpeed === "site" ||
    (fee?.protocol === SupportedProtocols.Ethereum && fee.site)
  ) {
    feeOptions.push({
      value: "site",
      label: "Suggested",
      subLabel: "(by Site)",
    });
  }

  return (
    <Controller
      control={control}
      name={"txSpeed"}
      render={({ field, fieldState: { error } }) => {
        const option = feeOptions.find((fee) => fee.value === field.value);

        return (
          <>
            <TextField
              select
              disabled={!fee}
              {...field}
              label={
                option ? (
                  <Typography color={themeColors.black}>
                    {option.label}
                    <span
                      style={{ marginLeft: "5px", color: themeColors.gray }}
                    >
                      {option.subLabel}
                    </span>
                  </Typography>
                ) : null
              }
              error={!!error}
              helperText={error?.message}
              sx={{
                marginTop,
                "& .MuiFormLabel-root": {
                  top: -6,
                },
                "& .MuiInputLabel-shrink": {
                  display: "none",
                },
                "& .MuiFormLabel-asterisk": {
                  display: "none",
                },
                "& .MuiSelect-select": {
                  display: "flex",
                  "& span": {
                    color: themeColors.gray,
                  },
                  color: !fee ? "#c9c9c9!important" : undefined,
                  WebkitTextFillColor: !fee ? "#c9c9c9!important" : undefined,
                  "& img": {
                    marginTop: 0.2,
                  },
                  "& svg": { display: "none" },
                },
                "& fieldset": {
                  "& legend": {
                    width: 0,
                  },
                  "& p": {
                    display: "none",
                  },
                },
                "& .MuiSelect-icon": { top: 4 },
              }}
            >
              {feeOptions.map(({ value, label, subLabel }) => {
                const isSelected = value === field.value;

                return (
                  <MenuItem
                    value={value}
                    key={value}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      "& svg": {
                        position: "absolute",
                        right: 15,
                      },
                      paddingRight: 3,
                      position: "relative",
                      color: themeColors.black,
                      backgroundColor: isSelected
                        ? `${themeColors.bgLightGray}!important`
                        : themeColors.white,
                    }}
                  >
                    {label}
                    <span style={{ marginLeft: "5px" }}>{subLabel}</span>
                    {isSelected && <SelectedIcon className="select_icon" />}
                  </MenuItem>
                );
              })}
            </TextField>
            {isUnwrapping && (
              <BalanceLabel marginTop={0.8} considerAsset={false} />
            )}
            <Stack
              spacing={1}
              direction={"row"}
              marginTop={isUnwrapping ? 0.4 : 0.8}
              alignItems={"center"}
              justifyContent={"space-between"}
              sx={{
                "& p": {
                  fontSize: 11,
                  lineHeight: "16px",
                },
              }}
            >
              <Typography>Fee</Typography>

              {fetchingFee && !fee ? (
                <Skeleton width={100} height={16} variant={"rectangular"} />
              ) : (
                <Stack
                  flexGrow={1}
                  minWidth={0}
                  spacing={0.6}
                  direction={"row"}
                  alignItems={"center"}
                >
                  <Typography
                    noWrap={true}
                    flexGrow={1}
                    minWidth={0}
                    textAlign={"right"}
                  >
                    {roundAndSeparate(
                      Number(
                        (fee as EthereumNetworkFee)?.[field.value]?.amount
                      ),
                      18,
                      "-"
                    )}
                  </Typography>
                  <Typography>
                    {networkSymbol}{" "}
                    {fee
                      ? `($ ${roundAndSeparate(
                          Number(
                            (fee as EthereumNetworkFee)?.[field.value]?.amount
                          ) * (usdPrice || 0),
                          2,
                          "0.00"
                        )})`
                      : ""}
                  </Typography>
                </Stack>
              )}
            </Stack>
          </>
        );
      }}
    />
  );
}
