import React from "react";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { Controller, useFormContext } from "react-hook-form";
import { InitializeVaultFormValues } from "./InitializeVault";
import PasswordStrengthBar from "../components/PasswordStrengthBar";
import PasswordInput from "../components/PasswordInput";
import { verifyPassword } from "../../utils";

export default function InitializeVaultForm() {
  const {
    control,
    formState: { isValid },
  } = useFormContext<InitializeVaultFormValues>();

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
        name={"password"}
        render={({ field, fieldState: { error } }) => (
          <>
            <PasswordInput
              sx={{ marginTop: 3.5 }}
              placeholder={"Password"}
              required
              autoFocus
              {...field}
              error={!!error}
              helperText={error?.message}
            />
            <PasswordStrengthBar password={field.value} />
          </>
        )}
      />

      <Controller
        control={control}
        name={"confirmPassword"}
        rules={{
          validate: (value, formValues) => {
            if (value === formValues.password) {
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
            {...field}
            error={!!error}
            helperText={error?.message}
          />
        )}
      />

      <Stack
        width={1}
        height={21}
        marginTop={2.4}
        direction={"row"}
        alignItems={"center"}
        justifyContent={"space-between"}
      >
        <Typography variant={"subtitle2"}>Keep Session Active</Typography>
        <Controller
          control={control}
          name={"keepSessionActive"}
          render={({ field }) => (
            <Switch size={"small"} {...field} checked={field.value} />
          )}
        />
      </Stack>
      <Button
        variant={"contained"}
        fullWidth
        sx={{ marginTop: 4 }}
        type={"submit"}
        disabled={!isValid}
      >
        Initialize Vault
      </Button>
    </>
  );
}
