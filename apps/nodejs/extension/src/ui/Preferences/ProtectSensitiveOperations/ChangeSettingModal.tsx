import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import React, { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useAppSelector } from "../../../hooks/redux";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import AppToBackground from "../../../controllers/communication/AppToBackground";
import { requirePasswordForSensitiveOptsSelector } from "../../../redux/selectors/preferences";
import useDidMountEffect from "../../../hooks/useDidMountEffect";
import SelectedIcon from "../../assets/img/check_icon.svg";
import DialogButtons from "../../components/DialogButtons";
import PasswordInput from "../../components/PasswordInput";
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

  const [status, setStatus] = useState<
    "form" | "success" | "loading" | "error"
  >("form");
  const [wrongPassword, setWrongPassword] = useState(false);

  useDidMountEffect(() => {
    if (wrongPassword) {
      setWrongPassword(false);
    }
  }, [vaultPassword]);

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

      return () => clearTimeout(timeout);
    }
  }, [open]);

  function onSubmit(data: FormValues) {
    setStatus("loading");
    AppToBackground.setRequirePasswordForOpts(data).then((res) => {
      if (res.data) {
        const { isPasswordWrong } = res.data;
        if (isPasswordWrong) {
          setWrongPassword(true);
          setStatus("form");
        } else {
          setStatus("success");
          //todo: notify user the changes where saved
          onClose();
        }
      } else if (res.error) {
        setStatus("error");
      }
    });
  }

  const canSave =
    selectedSetting !== protectSensitiveOperations || status === "success";

  let content: React.ReactNode;

  switch (status) {
    case "success":
    case "form": {
      const items: Array<SettingItem> = [
        {
          enabled: true,
        },
        {
          enabled: false,
          isDefault: true,
        },
      ];

      content = (
        <>
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
                            disabled={status !== "form"}
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
                      disabled={status !== "form"}
                      placeholder={"Vault Password"}
                      error={!!error || wrongPassword}
                      helperText={
                        wrongPassword ? "Wrong password" : error?.message
                      }
                      sx={{
                        marginBottom: !!error || wrongPassword ? 1 : 0,
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
              }}
              secondaryButtonProps={{ children: "Cancel", onClick: onClose }}
            />
          </DialogActions>
        </>
      );
      break;
    }
    case "loading":
      break;
    case "error":
      break;
  }

  return (
    <BaseDialog
      open={open}
      onClose={onClose}
      title={"Protect Sensitive Operations"}
      PaperProps={{ component: "form", onSubmit: handleSubmit(onSubmit) }}
    >
      {content}
    </BaseDialog>
  );
}
