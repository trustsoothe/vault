import PasswordStrengthBar from "react-password-strength-bar";
import { Controller, useForm } from "react-hook-form";
import React, { useCallback, useState } from "react";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import { initVault } from "../redux/slices/vault";
import { useAppDispatch } from "../hooks/redux";

interface FormValues {
  password: string;
  confirmPassword: string;
}

const InitializeVault: React.FC = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    control,
  } = useForm<FormValues>({
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });
  const dispatch = useAppDispatch();
  const [showPasswords, setShowPasswords] = useState(false);

  const toggleShowPasswords = useCallback(() => {
    setShowPasswords((prevState) => !prevState);
  }, []);

  const onSubmit = useCallback(
    (data: FormValues) => {
      dispatch(initVault(data.password));
    },
    [dispatch]
  );

  return (
    <Stack
      spacing={"10px"}
      alignItems={"center"}
      component={"form"}
      onSubmit={handleSubmit(onSubmit)}
    >
      <Stack spacing={"10px"}>
        <Typography variant={"h5"}>{"Let's get started"}</Typography>
        <Typography fontSize={"14px"}>
          To begin you need to initialize your vault by setting your password.
          Keep in mind that the password cannot be recovered.
        </Typography>
        <Typography fontSize={"12px"}>
          This password will be used to unlock your vault.
        </Typography>
      </Stack>

      <Stack marginTop={"40px!important"} width={300} spacing={"15px"}>
        <Stack
          direction={"row"}
          justifyContent={"flex-end"}
          marginBottom={"-15px"}
        >
          <Button
            sx={{
              fontSize: "12px",
              textTransform: "none",
            }}
            onClick={toggleShowPasswords}
          >
            {showPasswords ? "Hide" : "Show"} passwords
          </Button>
        </Stack>
        <Controller
          name={"password"}
          control={control}
          rules={{
            required: "Required",
            minLength: {
              value: 8,
              message: "Should have at least 8 characters.",
            },
          }}
          render={({ field, fieldState: { error } }) => (
            <>
              <TextField
                label={"Password"}
                size={"small"}
                type={showPasswords ? "text" : "password"}
                {...field}
                error={!!error}
                helperText={error?.message}
              />
              {!error?.message && (
                <PasswordStrengthBar
                  password={field.value}
                  shortScoreWord={"too weak"}
                  scoreWordStyle={{ fontSize: 12 }}
                />
              )}
            </>
          )}
        />

        <TextField
          label={"Confirm Password"}
          size={"small"}
          type={showPasswords ? "text" : "password"}
          {...register("confirmPassword", {
            required: "Required",
            validate: (value, formValues) => {
              if (value === formValues.password) {
                return true;
              }

              return "Passwords do not match.";
            },
          })}
          error={!!errors?.confirmPassword}
          helperText={errors?.confirmPassword?.message}
        />
        <Button
          sx={{
            marginX: "20px!important",
            marginTop: "30px!important",
            textTransform: "none",
            fontWeight: 600,
            height: 45,
            fontSize: 16,
            borderRadius: "100px",
          }}
          variant={"contained"}
          type={"submit"}
          disabled={!isDirty}
        >
          Initialize Vault
        </Button>
      </Stack>
    </Stack>
  );
};

export default InitializeVault;
