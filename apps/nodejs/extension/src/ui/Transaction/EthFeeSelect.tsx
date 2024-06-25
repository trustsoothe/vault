import type { EthereumNetworkFee } from "@poktscan/vault";
import type { TransactionFormValues } from "./BaseTransaction";
import React from "react";
import Stack from "@mui/material/Stack";
import Skeleton from "@mui/material/Skeleton";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { Controller, useFormContext } from "react-hook-form";
import { networkSymbolSelector } from "../../redux/selectors/network";
import SelectedIcon from "../assets/img/check_icon.svg";
import { useAppSelector } from "../../hooks/redux";
import { roundAndSeparate } from "../../utils/ui";
import useUsdPrice from "../hooks/useUsdPrice";
import { themeColors } from "../theme";

interface EthFeeSelectProps {
  marginTop?: number | string;
}

export default function EthFeeSelect({ marginTop = 1.2 }: EthFeeSelectProps) {
  const { control, watch } = useFormContext<TransactionFormValues>();
  const [fee, fetchingFee, protocol, chainId] = watch([
    "fee",
    "fetchingFee",
    "protocol",
    "chainId",
  ]);

  const networkSymbol = useAppSelector(networkSymbolSelector);
  const { usdPrice } = useUsdPrice({
    protocol,
    chainId,
  });

  return (
    <Controller
      control={control}
      name={"txSpeed"}
      render={({ field, fieldState: { error } }) => (
        <>
          <TextField
            select
            required
            disabled={!fee}
            {...field}
            error={!!error}
            helperText={error?.message}
            sx={{
              marginTop,
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
              "& .MuiSelect-icon": { top: 4 },
            }}
          >
            {[
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
              {
                value: "site",
                label: "Suggested",
                subLabel: "(by Site)",
              },
            ].map(({ value, label, subLabel }) => {
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
                  {label} <span style={{ marginLeft: "5px" }}>{subLabel}</span>
                  {isSelected && <SelectedIcon />}
                </MenuItem>
              );
            })}
          </TextField>
          <Stack
            spacing={1}
            direction={"row"}
            marginTop={0.8}
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
                    Number((fee as EthereumNetworkFee)?.[field.value]?.amount),
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
                        "-"
                      )})`
                    : ""}
                </Typography>
              </Stack>
            )}
          </Stack>
        </>
      )}
    />
  );
}
