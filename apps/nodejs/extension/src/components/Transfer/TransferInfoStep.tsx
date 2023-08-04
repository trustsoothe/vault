import type { FormValues } from "./index";
import type { ExternalTransferRequest } from "../../types/communication";
import { Controller, useFormContext } from "react-hook-form";
import TextField from "@mui/material/TextField";
import React, { useCallback } from "react";
import Stack from "@mui/material/Stack";
import AmountHelperText from "./AmountHelperText";

export const isHex = (str: string) => {
  return str.match(/^[0-9a-fA-F]+$/g);
};

export const byteLength = (str: string) => new Blob([str]).size;

const isAddress = (str: string) => isHex(str) && byteLength(str) === 40;

interface TransferInfoStepProps {
  fromBalance: number;
  isLoadingBalance?: boolean;
  errorBalance?: boolean;
  getBalance?: () => void;
  isLoadingFee?: boolean;
  errorFee?: boolean;
  getFee?: () => void;
  fee: number;
  request?: ExternalTransferRequest;
}

const TransferInfoStep: React.FC<TransferInfoStepProps> = ({
  request,
  fromBalance,
  isLoadingBalance,
  errorBalance,
  getBalance,
  fee,
  isLoadingFee,
  errorFee,
  getFee,
}) => {
  const { control, register, setValue, clearErrors, formState } =
    useFormContext<FormValues>();

  const onClickAll = useCallback(() => {
    const transferFromBalance = (fromBalance || 0) - (fee || 0);

    if (transferFromBalance) {
      setValue("amount", (transferFromBalance || "").toString());
      clearErrors("amount");
    }
  }, [fromBalance, setValue, clearErrors, fee]);

  return (
    <Stack width={1} spacing={"20px"}>
      <Controller
        control={control}
        name={"amount"}
        rules={{
          required: "Required",
          min: {
            value: fromBalance === 0 ? 0 : 0.01,
            message: "Min is 0.01",
          },
          max: fromBalance
            ? {
                value: fromBalance - fee || 0,
                message: `Max is ${fromBalance - fee || 0}`,
              }
            : undefined,
        }}
        render={({ field, fieldState: { error } }) => (
          <TextField
            label={"Amount"}
            fullWidth
            autoFocus
            size={"small"}
            type={"number"}
            disabled={!!request?.amount || fromBalance === 0}
            error={
              !!error?.message || fromBalance === 0 || errorFee || errorBalance
            }
            InputLabelProps={{ shrink: !!field.value }}
            helperText={
              <AmountHelperText
                isLoadingBalance={isLoadingBalance}
                accountBalance={fromBalance}
                errorBalance={errorBalance}
                getBalance={getBalance}
                disableAll={!!request?.amount}
                transferFee={fee}
                isLoadingFee={isLoadingFee}
                errorFee={errorFee}
                getFee={getFee}
                onClickAll={onClickAll}
              />
            }
            {...field}
          />
        )}
      />

      <TextField
        label={"To Address"}
        fullWidth
        size={"small"}
        disabled={!!request?.toAddress}
        {...register("toAddress", {
          required: "Required",
          validate: (value) => {
            if (!isAddress(value)) {
              return "Invalid Address";
            }

            return true;
          },
        })}
        error={!!formState?.errors?.toAddress}
        helperText={formState?.errors?.toAddress?.message}
        sx={{
          "& input, label": {
            fontSize: 14,
          },
        }}
      />

      <TextField
        label={"Memo"}
        fullWidth
        size={"small"}
        rows={2}
        multiline
        disabled={!!request?.memo}
        {...register("memo")}
      />
    </Stack>
  );
};

export default TransferInfoStep;
