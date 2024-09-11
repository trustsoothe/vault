import React from "react";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { Controller, useFormContext } from "react-hook-form";

export default function MemoInput() {
  const { control } = useFormContext<{ memo: string }>();
  return (
    <Controller
      control={control}
      name={"memo"}
      render={({ field, fieldState: { error } }) => (
        <>
          <TextField
            placeholder={"Memo (optional)"}
            autoComplete={"off"}
            sx={{
              marginTop: 1.6,
            }}
            {...field}
            error={!!error}
            helperText={error?.message}
          />
          <Typography fontSize={10} marginTop={0.5} lineHeight={"16px"}>
            Don’t put sensitive data here. This will be public in the chain.
          </Typography>
        </>
      )}
    />
  );
}
