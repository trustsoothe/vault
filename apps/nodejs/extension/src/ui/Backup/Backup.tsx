import { saveAs } from "file-saver";
import Stack from "@mui/material/Stack";
import React, { useState } from "react";
import Switch from "@mui/material/Switch";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { Controller, FormProvider, useForm } from "react-hook-form";
import AppToBackground from "../../controllers/communication/AppToBackground";
import useDidMountEffect from "../../hooks/useDidMountEffect";
import NewVaultPassword from "../components/NewVaultPassword";
import CircularLoading from "../components/CircularLoading";
import PasswordInput from "../components/PasswordInput";
import { enqueueSnackbar } from "../../utils/ui";

interface BackupFormValues {
  vaultPassword: string;
  newEncryptionPassword: string;
  confirmEncryptionPassword: string;
  useNewEncryptionPassword: boolean;
}

const defaultFormValues: BackupFormValues = {
  vaultPassword: "",
  newEncryptionPassword: "",
  confirmEncryptionPassword: "",
  useNewEncryptionPassword: false,
};

export default function Backup() {
  const methods = useForm<BackupFormValues>({
    defaultValues: defaultFormValues,
  });
  const {
    handleSubmit,
    reset,
    setValue,
    setFocus,
    clearErrors,
    watch,
    control,
    formState: { dirtyFields },
  } = methods;

  const [status, setStatus] = useState<"normal" | "loading" | "error">(
    "normal"
  );

  const [useNewEncryptionPassword] = watch(["useNewEncryptionPassword"]);

  const canSubmit =
    dirtyFields.vaultPassword &&
    (!useNewEncryptionPassword ||
      (dirtyFields.confirmEncryptionPassword &&
        dirtyFields.newEncryptionPassword));

  useDidMountEffect(() => {
    setValue("newEncryptionPassword", "");
    clearErrors("newEncryptionPassword");
    setValue("confirmEncryptionPassword", "");
    clearErrors("confirmEncryptionPassword");
  }, [useNewEncryptionPassword]);

  const onSubmit = (data: BackupFormValues) => {
    setStatus("loading");

    AppToBackground.exportVault({
      currentVaultPassword: data.vaultPassword,
      encryptionPassword: data.useNewEncryptionPassword
        ? data.newEncryptionPassword
        : undefined,
    }).then(({ data, error }) => {
      if (error) {
        setStatus("error");
      } else if (data.isPasswordWrong) {
        enqueueSnackbar({
          message: "Wrong Vault Password",
          variant: "error",
          key: "wrong_vault_password",
          preventDuplicate: true,
          autoHideDuration: 4000,
        });
        reset(defaultFormValues);
        setStatus("normal");
        setTimeout(() => setFocus("vaultPassword"), 0);
      } else {
        const blob = new Blob([JSON.stringify(data.vault)], {
          type: "application/json",
        });
        const filename = `soothe_vault_${new Date()
          .toISOString()
          .slice(0, 16)}.json`.replace(/:/g, "_");

        saveAs(blob, filename);
        enqueueSnackbar({
          variant: "success",
          message: {
            title: "Vault Exported",
            content: "Soothe has been exported successfully.",
          },
        });
        reset(defaultFormValues);
        setStatus("normal");
      }
    });
  };

  let content: React.ReactNode;

  switch (status) {
    case "normal":
      content = (
        <>
          <Stack
            width={30}
            height={30}
            alignItems={"center"}
            justifyContent={"center"}
            border={"1px solid black"}
          >
            logo
          </Stack>
          <Typography
            lineHeight={"20px"}
            width={280}
            textAlign={"center"}
            marginTop={1.3}
          >
            Backup your Soothe Vault to ensure access to your accounts in case
            you lose access to this computer.
          </Typography>
          <Typography
            fontSize={11}
            marginTop={2.5}
            marginBottom={1.2}
            letterSpacing={"0.1px"}
          >
            We recommend you to save your backup in another device or in a
            (safe) cloud storage service. To export your vault, please enter the
            vault’s password:
          </Typography>
          <Controller
            control={control}
            name={"vaultPassword"}
            render={({ field, fieldState: { error } }) => (
              <PasswordInput
                required
                autoFocus
                {...field}
                placeholder={"Vault Password"}
                error={!!error}
                helperText={error?.message}
              />
            )}
          />
          <Stack
            width={1}
            height={21}
            marginTop={2.6}
            direction={"row"}
            alignItems={"center"}
            justifyContent={"space-between"}
          >
            <Typography variant={"subtitle2"}>
              Encrypt With New Password
            </Typography>
            <Controller
              control={control}
              name={"useNewEncryptionPassword"}
              render={({ field }) => (
                <Switch size={"small"} {...field} checked={field.value} />
              )}
            />
          </Stack>

          {useNewEncryptionPassword && (
            <FormProvider {...methods}>
              <NewVaultPassword<BackupFormValues>
                confirmPasswordName={"confirmEncryptionPassword"}
                passwordName={"newEncryptionPassword"}
                marginTop={2.7}
              />
            </FormProvider>
          )}

          <Button
            fullWidth
            type={"submit"}
            disabled={!canSubmit}
            variant={"contained"}
            sx={{
              height: 37,
              marginTop: useNewEncryptionPassword ? 2.5 : 3.5,
              fontWeight: 500,
              boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.08)",
            }}
          >
            Export Vault
          </Button>
        </>
      );
      break;
    case "loading":
      content = <CircularLoading />;
      break;
    case "error":
      break;
  }

  return (
    <Stack
      paddingX={2.4}
      paddingTop={3}
      overflow={"auto"}
      alignItems={"center"}
      justifyContent={"center"}
      component={"form"}
      onSubmit={handleSubmit(onSubmit)}
    >
      {content}
    </Stack>
  );
}
