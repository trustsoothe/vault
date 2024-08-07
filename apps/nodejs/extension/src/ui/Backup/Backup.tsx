import { saveAs } from "file-saver";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import Typography from "@mui/material/Typography";
import { closeSnackbar, SnackbarKey } from "notistack";
import React, { useEffect, useRef, useState } from "react";
import { Controller, FormProvider, useForm } from "react-hook-form";
import AppToBackground from "../../controllers/communication/AppToBackground";
import NewVaultPassword from "../components/NewVaultPassword";
import useDidMountEffect from "../hooks/useDidMountEffect";
import PasswordInput from "../components/PasswordInput";
import LoadingButton from "../components/LoadingButton";
import BackupIcon from "../assets/img/backup_icon.svg";
import {
  enqueueErrorSnackbar,
  enqueueSnackbar,
  wrongPasswordSnackbar,
} from "../../utils/ui";

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
  const errorSnackbarKey = useRef<SnackbarKey>();
  const wrongPasswordSnackbarKey = useRef<SnackbarKey>();
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

  const [status, setStatus] = useState<"normal" | "loading">("normal");

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

  const closeSnackbars = () => {
    if (wrongPasswordSnackbarKey.current) {
      closeSnackbar(wrongPasswordSnackbarKey.current);
      wrongPasswordSnackbarKey.current = null;
    }

    if (errorSnackbarKey.current) {
      closeSnackbar(errorSnackbarKey.current);
      errorSnackbarKey.current = null;
    }
  };

  useEffect(() => {
    return closeSnackbars;
  }, []);

  const onSubmit = (data: BackupFormValues) => {
    setStatus("loading");

    AppToBackground.exportVault({
      currentVaultPassword: data.vaultPassword,
      encryptionPassword: data.useNewEncryptionPassword
        ? data.newEncryptionPassword
        : undefined,
    }).then(({ data: backupData, error }) => {
      if (error) {
        errorSnackbarKey.current = enqueueErrorSnackbar({
          message: "Vault Backup Failed",
          onRetry: () => onSubmit(data),
        });
      } else if (backupData.isPasswordWrong) {
        wrongPasswordSnackbarKey.current = wrongPasswordSnackbar();
        setStatus("normal");
        setTimeout(() => setFocus("vaultPassword"), 0);
      } else {
        const blob = new Blob([JSON.stringify(backupData.vault)], {
          type: "application/json",
        });
        const filename = `soothe_vault_${new Date()
          .toISOString()
          .slice(0, 16)}.json`.replace(/:/g, "_");

        saveAs(blob, filename);
        closeSnackbars();
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

  const isLoading = status === "loading";

  return (
    <Stack
      paddingX={2.4}
      paddingTop={1.7}
      overflow={"auto"}
      alignItems={"center"}
      justifyContent={"center"}
      component={"form"}
      onSubmit={handleSubmit(onSubmit)}
    >
      <BackupIcon />
      <Typography lineHeight={"20px"} width={280} textAlign={"center"}>
        Backup your Soothe Vault to ensure access to your accounts in case you
        lose access to this computer.
      </Typography>
      <Typography
        fontSize={11}
        marginTop={2.5}
        marginBottom={1.2}
        letterSpacing={"0.1px"}
      >
        We recommend you to save your backup in another device or in a (safe)
        cloud storage service. To export your vault, please enter the vault’s
        password:
      </Typography>
      <Controller
        control={control}
        name={"vaultPassword"}
        render={({ field, fieldState: { error } }) => (
          <PasswordInput
            required
            autoFocus
            disabled={isLoading}
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
        <Typography variant={"subtitle2"}>Encrypt With New Password</Typography>
        <Controller
          control={control}
          name={"useNewEncryptionPassword"}
          render={({ field }) => (
            <Switch
              size={"small"}
              {...field}
              disabled={isLoading}
              checked={field.value}
            />
          )}
        />
      </Stack>

      {useNewEncryptionPassword && (
        <FormProvider {...methods}>
          <NewVaultPassword<BackupFormValues>
            confirmPasswordName={"confirmEncryptionPassword"}
            passwordName={"newEncryptionPassword"}
            marginTop={2.7}
            disableInputs={isLoading}
          />
        </FormProvider>
      )}

      <LoadingButton
        fullWidth
        type={"submit"}
        isLoading={isLoading}
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
      </LoadingButton>
    </Stack>
  );
}
