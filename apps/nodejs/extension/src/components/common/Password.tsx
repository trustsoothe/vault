import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Controller, type PathValue, useFormContext } from "react-hook-form";
import PasswordStrengthBar from "react-password-strength-bar";
import Stack, { type StackProps } from "@mui/material/Stack";
import ContentCopy from "@mui/icons-material/ContentCopy";
import IconButton from "@mui/material/IconButton";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Button from "@mui/material/Button";
import { generateRandomPassword, verifyPassword } from "../../utils";

interface PasswordProps {
  passwordName: string;
  confirmPasswordName?: string;
  passwordAndConfirmEquals?: boolean;
  hidePasswordStrong?: boolean;
  labelPassword?: string;
  labelConfirm?: string;
  canGenerateRandom?: boolean;
  canGenerateRandomFirst?: boolean;
  canGenerateRandomSecond?: boolean;
  canShowPassword?: boolean;
  justRequire?: boolean;
  containerProps?: StackProps;
  inputsContainerProps?: StackProps;
  errorPassword?: string;
  errorConfirm?: string;
  horizontal?: boolean;
}

const Password: React.FC<PasswordProps> = function <T extends {}>({
  passwordName,
  confirmPasswordName,
  passwordAndConfirmEquals = true,
  hidePasswordStrong = false,
  labelPassword = "Password",
  labelConfirm = "Confirm Password",
  canGenerateRandom = true,
  canGenerateRandomFirst = canGenerateRandom,
  canGenerateRandomSecond = canGenerateRandom,
  canShowPassword = true,
  justRequire = false,
  containerProps,
  errorConfirm,
  errorPassword,
  horizontal = false,
  inputsContainerProps,
}) {
  const { control, register, setValue, clearErrors, watch, setFocus } =
    useFormContext<T>();
  const [showPassword, setShowPassword] = useState(false);
  const [random, setRandom] = useState(false);
  const [showCopyPassTooltip, setShowCopyPassTooltip] = useState(false);
  const [showCopyConfirmTooltip, setShowCopyConfirmTooltip] = useState(false);

  const [pass, confirm] = watch([passwordName, confirmPasswordName]);

  useEffect(() => {
    if (canGenerateRandomFirst || canGenerateRandomSecond) {
      if (random) {
        const pass = generateRandomPassword() as PathValue<any, any>;
        if (canGenerateRandomFirst) {
          setValue(passwordName, pass);
        }
        if (confirmPasswordName && canGenerateRandomSecond) {
          if (passwordAndConfirmEquals) {
            setValue(confirmPasswordName, pass);
          } else {
            setValue(
              confirmPasswordName,
              generateRandomPassword() as PathValue<any, any>
            );
          }
        }
      } else {
        if (canGenerateRandomFirst) {
          setValue(passwordName, "" as PathValue<any, any>);
          setFocus(passwordName);
        }
        if (confirmPasswordName && canGenerateRandomSecond) {
          setValue(confirmPasswordName, "" as PathValue<any, any>);
          if (!canGenerateRandomFirst) {
            setFocus(confirmPasswordName);
          }
        }
      }
      clearErrors(passwordName);
      if (confirmPasswordName) {
        clearErrors(confirmPasswordName);
      }
    }
  }, [random]);

  const onClickCopyPass = useCallback(() => {
    if (pass) {
      navigator.clipboard.writeText(pass as string).then(() => {
        setShowCopyPassTooltip(true);
        setTimeout(() => setShowCopyPassTooltip(false), 500);
      });
    }
  }, [pass]);

  const onClickCopyConfirm = useCallback(() => {
    if (confirm) {
      navigator.clipboard.writeText(confirm as string).then(() => {
        setShowCopyConfirmTooltip(true);
        setTimeout(() => setShowCopyConfirmTooltip(false), 500);
      });
    }
  }, [confirm]);

  const toggleShowPassword = useCallback(() => {
    setShowPassword((prevState) => !prevState);
  }, []);

  const toggleRandomPassword = useCallback(() => {
    setRandom((prevState) => !prevState);
  }, []);

  const actions = useMemo(() => {
    if (!canGenerateRandomSecond && !canGenerateRandomFirst && !canShowPassword)
      return null;

    return (
      <Stack
        direction={"row"}
        justifyContent={"flex-end"}
        marginBottom={"-15px"}
      >
        {(canGenerateRandomSecond || canGenerateRandomFirst) && (
          <Button
            sx={{
              fontSize: "12px",
              textTransform: "none",
              height: 25,
              paddingBottom: "3px",
            }}
            onClick={toggleRandomPassword}
          >
            {random ? "Introduce Password" : "Generate Random"}
          </Button>
        )}
        {canShowPassword &&
          !(random && !canGenerateRandomSecond && !confirmPasswordName) &&
          !(random && canGenerateRandom) && (
            <Button
              sx={{
                fontSize: "12px",
                textTransform: "none",
                width: 106,
                height: 25,
                paddingBottom: "3px",
              }}
              onClick={toggleShowPassword}
            >
              {showPassword ? "Hide" : "Show"} password
            </Button>
          )}
      </Stack>
    );
  }, [
    canShowPassword,
    showPassword,
    toggleRandomPassword,
    canGenerateRandomSecond,
    confirmPasswordName,
    canGenerateRandom,
    canGenerateRandomFirst,
    random,
  ]);

  const content = useMemo(() => {
    return (
      <Stack
        direction={horizontal ? "row" : "column"}
        spacing={"15px"}
        {...inputsContainerProps}
      >
        <Controller
          name={passwordName}
          control={control}
          rules={{
            validate: (value) => {
              if (justRequire) {
                if (!value) {
                  return "Required";
                }

                return true;
              }

              try {
                return verifyPassword(value as string);
              } catch (e) {
                return e.message as string;
              }
            },
          }}
          render={({ field: { ref, ...field }, fieldState: { error } }) => (
            <>
              <TextField
                label={labelPassword}
                size={"small"}
                type={
                  showPassword || (canGenerateRandomFirst && random)
                    ? "text"
                    : "password"
                }
                {...field}
                error={!!error || !!errorPassword}
                helperText={error?.message || errorPassword}
                inputRef={ref}
                InputProps={{
                  readOnly: random && canGenerateRandomFirst,
                  endAdornment:
                    random && canGenerateRandomFirst ? (
                      <Tooltip
                        title={"Copied"}
                        open={showCopyPassTooltip}
                        arrow
                      >
                        <IconButton
                          onClick={onClickCopyPass}
                          sx={{ padding: 0, width: 30 }}
                        >
                          <ContentCopy sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Tooltip>
                    ) : undefined,
                }}
              />
              {!error?.message && !hidePasswordStrong && (
                <PasswordStrengthBar
                  password={field.value as string}
                  shortScoreWord={"too weak"}
                  scoreWordStyle={{ fontSize: 12 }}
                />
              )}
            </>
          )}
        />

        {confirmPasswordName && !(random && passwordAndConfirmEquals) && (
          <Controller
            name={confirmPasswordName}
            rules={{
              validate: (value, formValues) => {
                if (!value) {
                  return "Required";
                }

                if (justRequire) return true;

                if (passwordAndConfirmEquals) {
                  if (value === formValues[passwordName]) {
                    return true;
                  }

                  return "Passwords do not match.";
                } else {
                  try {
                    return verifyPassword(value as string);
                  } catch (e) {
                    return e.message as string;
                  }
                }
              },
            }}
            control={control}
            render={({ field, fieldState: { error } }) => (
              <TextField
                label={labelConfirm}
                size={"small"}
                type={
                  showPassword || (canGenerateRandomSecond && random)
                    ? "text"
                    : "password"
                }
                error={!!error || !!errorConfirm}
                helperText={error?.message || errorConfirm}
                {...field}
                InputProps={{
                  readOnly: random && canGenerateRandomSecond,
                  endAdornment:
                    random && canGenerateRandomSecond ? (
                      <Tooltip
                        title={"Copied"}
                        open={showCopyConfirmTooltip}
                        arrow
                      >
                        <IconButton
                          onClick={onClickCopyConfirm}
                          sx={{ padding: 0, width: 30 }}
                        >
                          <ContentCopy sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Tooltip>
                    ) : undefined,
                }}
              />
            )}
          />
        )}
      </Stack>
    );
  }, [
    horizontal,
    inputsContainerProps,
    errorPassword,
    errorConfirm,
    passwordName,
    confirmPasswordName,
    passwordAndConfirmEquals,
    labelPassword,
    labelConfirm,
    showPassword,
    register,
    hidePasswordStrong,
    justRequire,
    control,
    showCopyConfirmTooltip,
    showCopyPassTooltip,
    onClickCopyConfirm,
    onClickCopyPass,
    random,
    canGenerateRandomSecond,
    canGenerateRandomFirst,
  ]);

  return (
    <Stack spacing={"15px"} {...containerProps}>
      {actions}
      {content}
    </Stack>
  );
};

export default Password;
