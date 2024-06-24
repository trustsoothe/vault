import { Controller, useFormContext } from "react-hook-form";
import TextField from "@mui/material/TextField";
import React from "react";

interface PassphraseInputProps {
  disabled?: boolean;
}

export default function PassphraseInput({ disabled }: PassphraseInputProps) {
  const { control } = useFormContext<{ passphrase: string }>();

  return (
    <Controller
      control={control}
      name={"passphrase"}
      render={({ field }) => (
        <TextField
          {...field}
          disabled={disabled}
          placeholder={"Passphrase (optional)"}
          sx={{ marginTop: 1.6 }}
        />
      )}
    />
  );
}
