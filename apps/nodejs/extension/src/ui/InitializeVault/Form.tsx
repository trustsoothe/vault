import React from "react";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import Typography from "@mui/material/Typography";
import { Controller, useFormContext } from "react-hook-form";
import { InitializeVaultFormValues } from "./InitializeVault";
import NewVaultPassword from "../components/NewVaultPassword";
import LoadingButton from "../components/LoadingButton";

interface InitializeVaultFormProps {
  isLoading: boolean;
}

export default function InitializeVaultForm({
  isLoading,
}: InitializeVaultFormProps) {
  const {
    control,
    formState: { isValid },
  } = useFormContext<InitializeVaultFormValues>();

  return (
    <>
      <NewVaultPassword<InitializeVaultFormValues>
        confirmPasswordName={"confirmPassword"}
        passwordName={"password"}
        disableInputs={isLoading}
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
            <Switch
              size={"small"}
              disabled={isLoading}
              {...field}
              checked={field.value}
            />
          )}
        />
      </Stack>
      <LoadingButton
        fullWidth
        sx={{ marginTop: 4 }}
        type={"submit"}
        disabled={!isValid || isLoading}
      >
        Initialize Vault
      </LoadingButton>
    </>
  );
}
