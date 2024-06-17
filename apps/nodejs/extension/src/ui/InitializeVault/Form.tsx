import React from "react";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { Controller, useFormContext } from "react-hook-form";
import { InitializeVaultFormValues } from "./InitializeVault";
import NewVaultPassword from "../components/NewVaultPassword";

export default function InitializeVaultForm() {
  const {
    control,
    formState: { isValid },
  } = useFormContext<InitializeVaultFormValues>();

  return (
    <>
      <NewVaultPassword<InitializeVaultFormValues>
        confirmPasswordName={"confirmPassword"}
        passwordName={"password"}
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
