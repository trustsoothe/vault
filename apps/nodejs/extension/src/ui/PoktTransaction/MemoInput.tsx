import React from "react";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { Controller, useFormContext } from "react-hook-form";
import { TransactionFormValues } from "../Transaction/BaseTransaction";
import { useAppSelector } from "../hooks/redux";
import { networksSelector } from "../../redux/selectors/network";

export default function MemoInput() {
  const networks = useAppSelector(networksSelector);
  const { control, watch } = useFormContext<TransactionFormValues>();

  const [protocol, chainId] = watch(["protocol", "chainId"]);

  const network = networks.find(
    (network) => network.protocol === protocol && network.chainId === chainId
  );

  return (
    <Controller
      control={control}
      name={"memo"}
      rules={{
        validate: (value) => {
          if (network.memoMaxLength) {
            if (value.length > network.memoMaxLength) {
              return `Max length allow is ${network.memoMaxLength}`;
            }
          }

          return true;
        },
      }}
      render={({ field, fieldState: { error } }) => (
        <>
          <TextField
            placeholder={"Memo (optional)"}
            autoComplete={"off"}
            sx={{
              marginTop: 1.6,
              ...(error && {
                marginBottom: 1,
              }),
            }}
            {...field}
            error={!!error}
            helperText={error?.message}
          />
          {!error && (
            <Typography fontSize={10} marginTop={0.5} lineHeight={"16px"}>
              Don’t put sensitive data here. This will be public in the chain.
            </Typography>
          )}
        </>
      )}
    />
  );
}
