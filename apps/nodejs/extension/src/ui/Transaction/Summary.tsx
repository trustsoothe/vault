import React from "react";
import Typography from "@mui/material/Typography";
import DialogContent from "@mui/material/DialogContent";
import { Controller, useFormContext } from "react-hook-form";
import { requirePasswordForSensitiveOptsSelector } from "../../redux/selectors/preferences";
import { TransactionFormValues } from "./BaseTransaction";
import PasswordInput from "../components/PasswordInput";
import { useAppSelector } from "../../hooks/redux";
import BaseSummary from "./BaseSummary";

export default function Summary() {
  const { control } = useFormContext<TransactionFormValues>();
  const requirePassword = useAppSelector(
    requirePasswordForSensitiveOptsSelector
  );

  return (
    <DialogContent sx={{ padding: "24px!important" }}>
      <BaseSummary />
      {requirePassword && (
        <>
          <Typography fontSize={11} marginTop={1.2} lineHeight={"16px"}>
            Please enter the vault’s password to proceed:
          </Typography>
          <Controller
            control={control}
            name={"vaultPassword"}
            render={({ field, fieldState: { error } }) => (
              <PasswordInput
                required
                {...field}
                placeholder={"Vault Password"}
                error={!!error}
                helperText={error?.message}
                sx={{
                  marginTop: 1.2,
                  marginBottom: !!error ? 1 : 0,
                  "& .MuiFormHelperText-root": {
                    fontSize: 10,
                  },
                }}
              />
            )}
          />
        </>
      )}
    </DialogContent>
  );
}
