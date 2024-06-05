import Stack from "@mui/material/Stack";
import { themeColors } from "../theme";
import Switch from "@mui/material/Switch";
import Collapse from "@mui/material/Collapse";
import Typography from "@mui/material/Typography";
import { useAppSelector } from "../../hooks/redux";
import React, { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { requirePasswordForSensitiveOptsSelector } from "../../redux/selectors/preferences";
import AppToBackground from "../../controllers/communication/AppToBackground";
import useDidMountEffect from "../../hooks/useDidMountEffect";
import PasswordInput from "../components/PasswordInput";
import DialogButtons from "../components/DialogButtons";

interface FormValues {
  enabled: boolean;
  vaultPassword: string;
}

export default function ProtectSensitiveOperations() {
  const requirePasswordForSensitiveOpts = useAppSelector(
    requirePasswordForSensitiveOptsSelector
  );
  const methods = useForm<FormValues>({
    defaultValues: {
      enabled: requirePasswordForSensitiveOpts,
      vaultPassword: "",
    },
  });
  const { control, reset, watch, handleSubmit } = methods;

  const [loading, setLoading] = useState(false);
  const [wrongPassword, setWrongPassword] = useState(false);
  const [enabled, vaultPassword] = watch(["enabled", "vaultPassword"]);

  useDidMountEffect(() => {
    if (wrongPassword) {
      setWrongPassword(false);
    }
  }, [vaultPassword]);

  const resetChanges = () => {
    reset({
      enabled: requirePasswordForSensitiveOpts,
      vaultPassword: "",
    });
  };

  useEffect(() => {
    resetChanges();
  }, [requirePasswordForSensitiveOpts]);

  function onSubmit(data: FormValues) {
    setLoading(true);
    AppToBackground.setRequirePasswordForOpts(data)
      .then((res) => {
        if (res.data) {
          const { isPasswordWrong } = res.data;
          if (isPasswordWrong) {
            setWrongPassword(true);
          } else {
            //todo: notify user the changes where saved
          }
        }
      })
      .finally(() => setLoading(false));
  }

  const showPassAndButtons = enabled !== requirePasswordForSensitiveOpts;

  return (
    <Stack component={"form"} onSubmit={handleSubmit(onSubmit)}>
      <Stack
        borderRadius={"8px"}
        sx={{
          backgroundColor: themeColors.bgLightGray,
        }}
      >
        <Stack
          sx={{
            width: 1,
            height: 54,
            paddingX: 1.4,
            paddingY: 1.8,
            alignItems: "center",
            boxSizing: "border-box",
            justifyContent: "space-between",
          }}
          direction={"row"}
        >
          <Typography variant={"subtitle2"} fontWeight={400}>
            Protect Sensitive Operations
          </Typography>
          <Controller
            control={control}
            name={"enabled"}
            render={({ field }) => (
              <Switch
                size={"small"}
                {...field}
                checked={field.value}
                disabled={loading}
              />
            )}
          />
        </Stack>
        <Collapse
          in={showPassAndButtons}
          sx={{
            paddingX: 2,
            paddingBottom: showPassAndButtons ? 1.5 : 0,
          }}
        >
          <Typography fontSize={11} marginBottom={0.5}>
            To apply the changes, please enter the vault password:
          </Typography>
          <Controller
            control={control}
            name={"vaultPassword"}
            render={({ field, fieldState: { error } }) => (
              <PasswordInput
                required
                {...field}
                placeholder={"Vault Password"}
                error={!!error || wrongPassword}
                helperText={wrongPassword ? "Wrong password" : error?.message}
                sx={{
                  marginBottom: !!error || wrongPassword ? 1 : 0,
                  "& .MuiFormHelperText-root": {
                    fontSize: 10,
                  },
                }}
              />
            )}
          />
          <DialogButtons
            containerProps={{
              sx: {
                height: 30,
                padding: 0,
                marginTop: 1.5,
                "& button": {
                  height: 30,
                  fontWeight: 400,
                },
              },
            }}
            secondaryButtonProps={{
              children: "Cancel",
              onClick: resetChanges,
            }}
            primaryButtonProps={{
              children: "Save",
              type: "submit",
            }}
          />
        </Collapse>
      </Stack>
      <Typography
        fontSize={11}
        color={themeColors.textSecondary}
        marginTop={0.8}
      >
        If enabled you’ll be required to enter the vault’s password for the
        following operations: transactions, remove account.
      </Typography>
    </Stack>
  );
}
