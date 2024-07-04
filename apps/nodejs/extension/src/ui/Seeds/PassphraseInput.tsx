import React from "react";
import { Controller, useFormContext } from "react-hook-form";
import PasswordInput from "../components/PasswordInput";

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
        <PasswordInput
          {...field}
          disabled={disabled}
          placeholder={"Passphrase (optional)"}
          sx={{ marginTop: 1.6 }}
        />
      )}
    />
  );
}
