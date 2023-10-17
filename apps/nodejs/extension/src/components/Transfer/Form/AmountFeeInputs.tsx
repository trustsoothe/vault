import type { FormValues } from "../index";
import Stack from "@mui/material/Stack";
import { useTheme } from "@mui/material";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import React, { useCallback, useMemo } from "react";
import { Controller, useFormContext } from "react-hook-form";
import AmountHelperText from "./AmountHelperText";

export type AmountStatus = "not-fetched" | "loading" | "error" | "fetched";

interface AmountFeeInputsProps {
  balanceStatus: AmountStatus;
  fromBalance: number;
  feeStatus: AmountStatus;
  fee: number;
  requestAmount?: number;
  requestFee?: number;
  getBalance: () => void;
  getFee: () => void;
}

const AmountFeeInputs: React.FC<AmountFeeInputsProps> = ({
  balanceStatus,
  feeStatus,
  fee,
  fromBalance,
  getFee,
  getBalance,
  requestAmount,
  requestFee,
}) => {
  const theme = useTheme();
  const { control, watch, formState, getValues, setValue, clearErrors } =
    useFormContext<FormValues>();
  const [asset, from, fromType] = watch(["asset", "from", "fromType"]);

  const amountHelper = useMemo(() => {
    if (fromBalance === 0) {
      return "This account doesn't have balance.";
    }

    if (formState.errors.amount?.message) {
      return formState.errors.amount?.message;
    }

    if (fromType === "private_key") {
      const hideBalanceDueWrongPk = formState.errors.from?.message?.includes(
        "Should be the PK of"
      );

      return (
        <AmountHelperText
          isLoadingBalance={balanceStatus === "loading"}
          accountBalance={fromBalance}
          errorBalance={balanceStatus === "error"}
          getBalance={getBalance}
          disableAll={!!requestAmount}
          hideBalance={!asset || !from || hideBalanceDueWrongPk}
          hideFee={true}
        />
      );
    }

    return null;
  }, [
    fromBalance,
    formState,
    fromType,
    balanceStatus,
    fromBalance,
    asset,
    from,
    requestAmount,
  ]);

  const onClickAll = useCallback(() => {
    const feeFromForm = getValues("fee");
    const transferFromBalance = (fromBalance || 0) - (Number(feeFromForm) || 0);

    if (transferFromBalance) {
      setValue("amount", (transferFromBalance || "").toString());
      clearErrors("amount");
    }
  }, [fromBalance, setValue, clearErrors, getValues]);

  const amountInputError =
    !!formState.errors.amount || fromBalance === 0 || balanceStatus === "error";
  const disableAmountInput = !!requestAmount || !fromBalance;

  return (
    <Stack
      direction={"row"}
      alignItems={"center"}
      sx={{
        order: 4,
        "& .MuiFormHelperText-root": {
          bottom: "-24px",
          width: "calc(100% - 30px)",
        },
      }}
      spacing={2}
      paddingTop={0.5}
    >
      <Controller
        control={control}
        name={"amount"}
        rules={{
          required: "Required",
          validate: (value, formValues: FormValues) => {
            const amount = Number(value);
            const fee = Number(formValues.fee);

            if (isNaN(amount) || isNaN(fee)) {
              return "Invalid amount";
            }

            if (balanceStatus !== "fetched" || feeStatus !== "fetched") {
              return "";
            }

            const total = amount + fee;

            const min = 1 / 1e6;
            if (amount < min) {
              return `Min is ${min}`;
            }

            return total > fromBalance
              ? `Amount + Fee must be lower than balance`
              : true;
          },
        }}
        render={({ field }) => (
          <TextField
            label={asset ? `Amount (${asset.symbol})` : "Amount"}
            fullWidth
            size={"small"}
            type={"number"}
            disabled={disableAmountInput}
            error={amountInputError}
            InputLabelProps={{ shrink: !!field.value }}
            sx={{
              "& .MuiFormHelperText-root": {
                bottom: amountInputError ? "-16px" : undefined,
              },
              "& .MuiInputBase-root": {
                fontSize: 16,
                fontWeight: 700,
              },
            }}
            InputProps={{
              endAdornment: (
                <Button
                  onClick={onClickAll}
                  disabled={disableAmountInput}
                  sx={{
                    minWidth: 40,
                    height: 20,
                    padding: 0,
                    color: theme.customColors.primary500,
                    marginTop: 0.2,
                    fontSize: 13,
                    textDecoration: "underline",
                    "&:hover": {
                      textDecoration: "underline",
                      backgroundColor: theme.customColors.white,
                    },
                  }}
                >
                  All
                </Button>
              ),
            }}
            helperText={amountHelper}
            {...field}
          />
        )}
      />
      <Controller
        name={"fee"}
        control={control}
        rules={{
          deps: ["amount"],
          min: {
            value: fee || 0,
            message: `Min: ${fee || 0}`,
          },
        }}
        render={({ field, fieldState: { error } }) => (
          <Stack width={110}>
            <TextField
              {...field}
              fullWidth
              label={asset ? `Fee (${asset.symbol})` : "Fee"}
              disabled={!!requestFee || !fee}
              InputLabelProps={{ shrink: !!field.value }}
              type={"number"}
              autoComplete={"off"}
              sx={{
                width: 90,
                "& .MuiInputBase-root": {
                  width: 90,
                  fontSize: 16,
                  fontWeight: 700,
                },
              }}
              error={!!error?.message || feeStatus === "error"}
              helperText={
                <AmountHelperText
                  hideBalance={true}
                  hideFee={!asset}
                  transferFee={fee}
                  isLoadingFee={feeStatus === "loading"}
                  errorFee={feeStatus === "error"}
                  getFee={getFee}
                />
              }
            />
          </Stack>
        )}
      />
    </Stack>
  );
};

export default AmountFeeInputs;
