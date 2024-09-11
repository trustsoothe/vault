import React from "react";
import { Controller, useFormContext } from "react-hook-form";
import TextFieldWithPaste from "../../components/TextFieldWithPaste";

interface ServiceUrlInputProps {
  marginTop?: number;
}

export default function ServiceUrlInput({
  marginTop = 0.8,
}: ServiceUrlInputProps) {
  const { control } = useFormContext<{ serviceURL: string }>();

  return (
    <Controller
      control={control}
      name={"serviceURL"}
      rules={{
        required: "Required",
        validate: (value) => {
          if (!value) {
            return "Required";
          }

          try {
            new URL(value);
            return true;
          } catch {
            return "Invalid URL";
          }
        },
      }}
      render={({ field, fieldState: { error } }) => (
        <TextFieldWithPaste
          {...field}
          required
          autoComplete={"off"}
          placeholder={"Service URL"}
          error={!!error}
          helperText={error?.message}
          onPaste={(url) => field.onChange(url)}
          sx={{
            marginTop,
            marginBottom: error ? 1 : undefined,
          }}
        />
      )}
    />
  );
}
