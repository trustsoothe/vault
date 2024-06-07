import { Controller, useFormContext } from "react-hook-form";
import TextField from "@mui/material/TextField";
import React from "react";

export default function PassphraseInput() {
  const { control } = useFormContext<{ passphrase: string }>();

  return (
    <Controller
      control={control}
      name={"passphrase"}
      render={({ field }) => (
        <TextField
          {...field}
          placeholder={"Passphrase (optional)"}
          sx={{ marginTop: 1.6 }}
        />
      )}
    />
  );
}
