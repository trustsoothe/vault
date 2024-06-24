import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { Controller, useForm } from "react-hook-form";
import { closeSnackbar, SnackbarKey } from "notistack";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import React, { useEffect, useRef, useState } from "react";
import AppToBackground from "../../../controllers/communication/AppToBackground";
import { requirePasswordForSensitiveOptsSelector } from "../../../redux/selectors/preferences";
import { enqueueErrorSnackbar, wrongPasswordSnackbar } from "../../../utils/ui";
import SelectedIcon from "../../assets/img/check_icon.svg";
import DialogButtons from "../../components/DialogButtons";
import PasswordInput from "../../components/PasswordInput";
import { useAppSelector } from "../../../hooks/redux";
import BaseDialog from "../../components/BaseDialog";
import { themeColors } from "../../theme";

interface SettingItem {
  enabled: boolean;
  isDefault?: boolean;
}

interface FormValues {
  enabled: boolean;
  vaultPassword: string;
}

interface ChangeSettingModalProps {
  open: boolean;
  onClose: () => void;
}

export default function ChangeSettingModal({
  open,
  onClose,
}: ChangeSettingModalProps) {
  const errorSnackbarKey = useRef<SnackbarKey>();
  const wrongPasswordSnackbarKey = useRef<SnackbarKey>();

  const protectSensitiveOperations = useAppSelector(
    requirePasswordForSensitiveOptsSelector
  );

  const { reset, handleSubmit, watch, control } = useForm<FormValues>({
    defaultValues: {
      enabled: protectSensitiveOperations,
      vaultPassword: "",
    },
  });
  const [selectedSetting, vaultPassword] = watch(["enabled", "vaultPassword"]);

  const [status, setStatus] = useState<"form" | "loading">("form");

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
    if (open) {
      reset({
        enabled: protectSensitiveOperations,
        vaultPassword: "",
      });
    } else {
      const timeout = setTimeout(() => {
        reset({
          enabled: protectSensitiveOperations,
          vaultPassword: "",
        });
        setStatus("form");
      }, 150);
      closeSnackbars();

      return () => {
        closeSnackbars();
        clearTimeout(timeout);
      };
    }
  }, [open]);

  function onSubmit(data: FormValues) {
    setStatus("loading");
    AppToBackground.setRequirePasswordForOpts(data).then((res) => {
      if (res.data) {
        const { isPasswordWrong } = res.data;
        if (isPasswordWrong) {
          wrongPasswordSnackbarKey.current = wrongPasswordSnackbar();
          setStatus("form");
        } else {
          setStatus("loading");
          closeSnackbars();
          onClose();
        }
      } else if (res.error) {
        errorSnackbarKey.current = enqueueErrorSnackbar({
          message: "Error while saving your Changes",
          onRetry: () => onSubmit(data),
        });
      }
    });
  }

  const canSave = selectedSetting !== protectSensitiveOperations;

  const items: Array<SettingItem> = [
    {
      enabled: true,
    },
    {
      enabled: false,
      isDefault: true,
    },
  ];

  const isLoading = status === "loading";

  return (
    <BaseDialog
      open={open}
      onClose={onClose}
      isLoading={isLoading}
      title={"Protect Sensitive Operations"}
      PaperProps={{ component: "form", onSubmit: handleSubmit(onSubmit) }}
    >
      <DialogContent
        sx={{
          rowGap: 1.2,
          padding: "0!important",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Stack padding={"16px 8px"} spacing={0.2}>
          <Controller
            control={control}
            name={"enabled"}
            render={({ field: { value, onChange } }) => {
              return (
                <>
                  {items.map(({ enabled, isDefault }, index) => {
                    const isSelected = enabled === value;

                    return (
                      <Button
                        key={index}
                        sx={{
                          width: 1,
                          height: 46,
                          paddingY: 1.5,
                          paddingRight: 5,
                          fontWeight: 400,
                          paddingLeft: 1.6,
                          borderRadius: "8px",
                          position: "relative",
                          color: themeColors.black,
                          backgroundColor: isSelected
                            ? themeColors.bgLightGray
                            : themeColors.white,
                          justifyContent: "space-between",
                          "& svg": {
                            position: "absolute",
                            right: 20,
                          },
                        }}
                        disabled={status !== "form" || isLoading}
                        onClick={() => {
                          if (!isSelected) {
                            onChange(enabled);
                          }
                        }}
                      >
                        <span>{enabled ? "Yes" : "No"}</span>
                        {isDefault && (
                          <Typography color={themeColors.textSecondary}>
                            (Default)
                          </Typography>
                        )}
                        {isSelected && <SelectedIcon />}
                      </Button>
                    );
                  })}
                </>
              );
            }}
          />
        </Stack>
        <Stack
          padding={"24px 20px"}
          spacing={1.2}
          borderTop={`1px solid ${themeColors.borderLightGray}`}
        >
          <Typography fontSize={11} lineHeight={"16px"}>
            When enabled will require vault password for the following
            operations: transactions, remove account.{" "}
            {canSave
              ? `To change this setting, please enter the vault’s password:`
              : ""}
          </Typography>

          {canSave && (
            <Controller
              control={control}
              name={"vaultPassword"}
              render={({ field, fieldState: { error } }) => (
                <PasswordInput
                  required
                  {...field}
                  disabled={status !== "form" || isLoading}
                  placeholder={"Vault Password"}
                  error={!!error}
                  helperText={error?.message}
                  sx={{
                    marginBottom: !!error ? 1 : 0,
                    "& .MuiFormHelperText-root": {
                      fontSize: 10,
                    },
                  }}
                />
              )}
            />
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ padding: 0, height: 85 }}>
        <DialogButtons
          primaryButtonProps={{
            children: "Save",
            disabled: !canSave || !vaultPassword || status !== "form",
            type: "submit",
            isLoading,
          }}
          secondaryButtonProps={{
            children: "Cancel",
            onClick: onClose,
            disabled: isLoading,
          }}
        />
      </DialogActions>
    </BaseDialog>
  );
}
