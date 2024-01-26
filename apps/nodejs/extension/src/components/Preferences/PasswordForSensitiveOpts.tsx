import React, { useCallback, useState } from "react";
import Stack from "@mui/material/Stack";
import { useTheme } from "@mui/material";
import Switch from "@mui/material/Switch";
import Button from "@mui/material/Button";
import Collapse from "@mui/material/Collapse";
import Typography from "@mui/material/Typography";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { useAppDispatch, useAppSelector } from "../../hooks/redux";
import useDidMountEffect from "../../hooks/useDidMountEffect";
import Password from "../common/Password";
import { enqueueSnackbar } from "../../utils/ui";
import AppToBackground from "../../controllers/communication/AppToBackground";
import { requirePasswordForSensitiveOptsSelector } from "../../redux/selectors/preferences";

interface FormValues {
  enabled: boolean;
  vaultPassword: string;
}

const PasswordForSensitiveOpts: React.FC = () => {
  const theme = useTheme();
  const dispatch = useAppDispatch();
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

  const resetForm = useCallback(() => {
    reset({
      enabled: requirePasswordForSensitiveOpts,
      vaultPassword: "",
    });
  }, [requirePasswordForSensitiveOpts]);

  useDidMountEffect(() => {
    resetForm();
  }, [resetForm]);

  const onSubmit = useCallback(
    (data: FormValues) => {
      setLoading(true);
      AppToBackground.setRequirePasswordForOpts(data)
        .then((res) => {
          if (res.data) {
            const { isPasswordWrong } = res.data;
            if (isPasswordWrong) {
              setWrongPassword(true);
            } else {
              enqueueSnackbar({
                variant: "success",
                message: "Changes applied successfully!",
              });
            }
          }
        })
        .finally(() => setLoading(false));
    },
    [dispatch]
  );

  const cancelChanges = useCallback(() => {
    resetForm();
  }, [resetForm]);

  const showPassAndButtons = enabled !== requirePasswordForSensitiveOpts;

  return (
    <Stack spacing={0.5} component={"form"} onSubmit={handleSubmit(onSubmit)}>
      <Stack direction={"row"} alignItems={"center"} spacing={0.7}>
        <Typography fontSize={13} fontWeight={500}>
          Ask for password on sensitive operations:{" "}
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
      <Typography fontSize={10} color={theme.customColors.dark75}>
        When this is enabled you will be required to insert the vault password
        for the following operations: transactions and remove account.
      </Typography>
      <Collapse in={showPassAndButtons}>
        <Typography fontSize={12} marginTop={0.5}>
          To apply the changes, please enter the vault password:
        </Typography>
        <FormProvider {...methods}>
          <Password
            containerProps={{
              marginTop: 1,
              marginBottom: 1.5,
            }}
            passwordName={"vaultPassword"}
            labelPassword={"Vault Password"}
            canGenerateRandom={false}
            autofocusPassword={true}
            hidePasswordStrong={true}
            justRequire={true}
            inputsDisabled={loading}
            errorPassword={wrongPassword ? "Invalid password" : undefined}
          />
        </FormProvider>
        <Stack
          direction={"row"}
          spacing={2}
          width={1}
          paddingX={4}
          boxSizing={"border-box"}
          marginTop={"10px!important"}
          marginBottom={"5px!important"}
        >
          <Button
            sx={{
              fontWeight: 700,
              color: theme.customColors.dark50,
              borderColor: theme.customColors.dark25,
              height: 24,
              borderWidth: 1.5,
              fontSize: 12,
            }}
            variant={"outlined"}
            fullWidth
            onClick={cancelChanges}
          >
            Cancel
          </Button>
          <Button
            sx={{
              fontWeight: 700,
              height: 24,
              fontSize: 12,
            }}
            variant={"contained"}
            fullWidth
            type={"submit"}
            disabled={loading}
          >
            Save
          </Button>
        </Stack>
      </Collapse>
    </Stack>
  );
};

export default PasswordForSensitiveOpts;
