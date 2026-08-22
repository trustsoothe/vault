import React, { Suspense } from "react";
import { Controller, Path, useFormContext } from "react-hook-form";
import { verifyPassword } from "../../utils";
import PasswordInput from "./PasswordInput";

// the strength meter ships zxcvbn's dictionaries (~800 KB); only load it when
// a password is being created instead of on every extension page load
const PasswordStrengthBar = React.lazy(() => import("./PasswordStrengthBar"));

interface NewVaultPasswordProps<T extends {}> {
  passwordName: Path<T>;
  confirmPasswordName: Path<T>;
  marginTop?: number;
  disableInputs?: boolean;
}

export default function NewVaultPassword<T extends {}>({
  passwordName,
  confirmPasswordName,
  marginTop = 3.5,
  disableInputs,
}: NewVaultPasswordProps<T>) {
  const { control } = useFormContext<T>();

  return (
    <>
      <Controller
        control={control}
        rules={{
          required: "Required",
          validate: (value) => {
            try {
              return verifyPassword(value as string);
            } catch (e) {
              return e.message as string;
            }
          },
        }}
        name={passwordName}
        render={({ field, fieldState: { error } }) => (
          <>
            <PasswordInput
              sx={{ marginTop }}
              placeholder={"Password"}
              required
              autoFocus
              {...field}
              error={!!error}
              helperText={error?.message}
              disabled={disableInputs}
            />
            <Suspense fallback={null}>
              <PasswordStrengthBar password={field.value} />
            </Suspense>
          </>
        )}
      />

      <Controller
        control={control}
        name={confirmPasswordName}
        rules={{
          validate: (value, formValues) => {
            if (value === formValues[passwordName as string]) {
              return true;
            }

            return "Passwords do not match";
          },
        }}
        render={({ field, fieldState: { error } }) => (
          <PasswordInput
            required={true}
            sx={{ marginTop: 2.1 }}
            canShowPassword={false}
            placeholder={"Confirm Password"}
            disabled={disableInputs}
            {...field}
            error={!!error}
            helperText={error?.message}
          />
        )}
      />
    </>
  );
}
