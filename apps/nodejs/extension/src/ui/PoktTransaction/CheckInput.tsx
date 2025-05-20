import type { PoktTransactionFormValues } from "./BaseTransaction";
import React from "react";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import Typography from "@mui/material/Typography";
import { Controller, useFormContext } from "react-hook-form";
import { themeColors } from "../theme";

interface CheckInputProps {
  moreThanOne?: boolean;
  isSigning?: boolean;
}

export default function CheckInput({
  moreThanOne,
  isSigning,
}: CheckInputProps) {
  const { control } = useFormContext<PoktTransactionFormValues>();
  return (
    <Controller
      control={control}
      name={"useIsSure"}
      rules={{
        validate: (value) => {
          return !value ? "Confirm transaction to proceed" : true;
        },
      }}
      render={({ field, fieldState: { error } }) => (
        <>
          <Stack
            width={1}
            height={21}
            marginTop={1}
            direction={"row"}
            alignItems={"center"}
            justifyContent={"space-between"}
          >
            <Typography
              variant={"subtitle2"}
              fontSize={12}
              color={error ? themeColors.red : undefined}
            >
              Confirm Transaction{moreThanOne ? "s" : ""}
            </Typography>
            <Switch size={"small"} {...field} checked={field.value} />
          </Stack>
          <Typography
            fontSize={10}
            marginTop={0.4}
            lineHeight={"13px"}
            color={error ? themeColors.red : undefined}
          >
            Please confirm before {isSigning ? "signing" : "executing"} this
            transaction{moreThanOne ? "s" : ""}; we are not responsible for any
            unexpected results.
          </Typography>
        </>
      )}
    />
  );
}
