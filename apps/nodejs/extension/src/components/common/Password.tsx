import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Controller, type PathValue, useFormContext } from "react-hook-form";
import PasswordStrengthBar from "react-password-strength-bar";
import Stack, { type StackProps } from "@mui/material/Stack";
import IconButton from "@mui/material/IconButton";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Button from "@mui/material/Button";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { type TextFieldProps, useTheme } from "@mui/material";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { generateRandomPassword, verifyPassword } from "../../utils";
import CopyIcon from "../../assets/img/gray_copy_icon.svg";

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
  autofocusPassword?: boolean;
  randomKey?: string;
}

interface TextFieldWithShowPasswordProps
  extends Omit<TextFieldProps<"outlined">, "variant"> {
  canShowPassword?: boolean;
  overrideType?: boolean;
  endAdornments?: React.ReactNode[];
}

const TextFieldWithShowPassword: React.FC<TextFieldWithShowPasswordProps> = ({
  canShowPassword = true,
  overrideType = false,
  endAdornments,
  ...others
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const toggleShowPassword = useCallback(() => {
    setShowPassword((prevState) => !prevState);
  }, []);

  const endAdornment = useMemo(() => {
    if (!canShowPassword && !endAdornments?.length) {
      return null;
    }

    const adornments: React.ReactNode[] = endAdornments?.length
      ? [...endAdornments]
      : [];

    if (canShowPassword) {
      adornments.push(
        <IconButton
          onClick={toggleShowPassword}
          sx={{ padding: 0, width: 40, height: 40 }}
          key={"show-password-toggle"}
        >
          {showPassword ? (
            <VisibilityOffIcon sx={{ fontSize: 18 }} />
          ) : (
            <VisibilityIcon sx={{ fontSize: 18 }} />
          )}
        </IconButton>
      );
    }

    return <Stack direction={"row"}>{adornments.map((item) => item)}</Stack>;
  }, [endAdornments, showPassword, canShowPassword, toggleShowPassword]);

  return (
    <TextField
      size={"small"}
      variant={"outlined"}
      {...others}
      type={showPassword && canShowPassword ? "text" : "password"}
      InputProps={{
        endAdornment: endAdornment,
        ...others?.InputProps,
      }}
      {...(overrideType && {
        type: others.type,
      })}
    />
  );
};

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
  autofocusPassword = false,
  randomKey,
}) {
  const {
    control,
    register,
    setValue,
    clearErrors,
    watch,
    setFocus,
    getValues,
  } = useFormContext<T>();
  const theme = useTheme();
  const [random, setRandom] = useState(false);
  const [showCopyPassTooltip, setShowCopyPassTooltip] = useState(false);
  const [showCopyConfirmTooltip, setShowCopyConfirmTooltip] = useState(false);

  const [pass, confirm] = watch([passwordName, confirmPasswordName]);

  useEffect(() => {
    if (randomKey) {
      const wasRandom = localStorage.getItem(randomKey) === "true";

      if (wasRandom) {
        if (
          passwordName &&
          confirmPasswordName &&
          canGenerateRandomSecond &&
          canGenerateRandomFirst
        ) {
          try {
            const pass = getValues(passwordName);
            const confirm = getValues(confirmPasswordName);
            verifyPassword(pass as unknown as string);
            verifyPassword(confirm as unknown as string);

            setRandom(true);
            return;
          } catch (e) {}
        } else {
          if (canGenerateRandomFirst) {
            try {
              const pass = getValues(passwordName);
              verifyPassword(pass as unknown as string);

              setRandom(true);
              return;
            } catch (e) {}
          }
        }

        localStorage.removeItem(randomKey);
      }
    }
  }, []);

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

  const toggleRandomPassword = useCallback(() => {
    const newRandom = !random;
    if (canGenerateRandomFirst || canGenerateRandomSecond) {
      if (newRandom) {
        const pass = generateRandomPassword() as PathValue<any, any>;
        if (canGenerateRandomFirst) {
          setValue(passwordName, pass);
          setFocus(passwordName);
        }
        if (confirmPasswordName && canGenerateRandomSecond) {
          if (!passwordAndConfirmEquals) {
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
        if (
          confirmPasswordName &&
          canGenerateRandomSecond &&
          !passwordAndConfirmEquals
        ) {
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

      if (randomKey) {
        localStorage.setItem(randomKey, `${newRandom}`);
      }
      setRandom(newRandom);
    }
  }, [
    randomKey,
    random,
    setValue,
    setFocus,
    canGenerateRandomFirst,
    passwordAndConfirmEquals,
    passwordName,
    confirmPasswordName,
    canGenerateRandomSecond,
    clearErrors,
  ]);

  const actions = useMemo(() => {
    if (!canGenerateRandomSecond && !canGenerateRandomFirst) return null;

    return (
      <Stack
        direction={"row"}
        justifyContent={"flex-end"}
        marginBottom={"-15px"}
      >
        {(canGenerateRandomSecond || canGenerateRandomFirst) && (
          <Button
            sx={{
              fontSize: "13px",
              fontWeight: 500,
              textTransform: "none",
              height: 25,
              paddingBottom: "3px",
              textDecoration: "underline",
              cursor: theme.customColors.primary500,
              "&:hover": {
                textDecoration: "underline",
              },
            }}
            onClick={toggleRandomPassword}
          >
            {random ? "Introduce Password" : "Generate Random"}
          </Button>
        )}
      </Stack>
    );
  }, [
    toggleRandomPassword,
    canGenerateRandomSecond,
    canGenerateRandomFirst,
    random,
    theme,
  ]);

  const content = useMemo(() => {
    const isRandomFirstPassword = canGenerateRandomFirst && random;
    const isRandomSecondPassword =
      canGenerateRandomSecond && !passwordAndConfirmEquals && random;
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
              <TextFieldWithShowPassword
                autoFocus={autofocusPassword}
                label={labelPassword}
                size={"small"}
                canShowPassword={
                  isRandomFirstPassword ? false : canShowPassword
                }
                type={isRandomFirstPassword ? "text" : "password"}
                overrideType={isRandomFirstPassword}
                {...field}
                error={!!error || !!errorPassword}
                helperText={error?.message || errorPassword}
                inputRef={ref}
                endAdornments={
                  isRandomFirstPassword
                    ? [
                        <React.Fragment key={"copy-password-button"}>
                          <Tooltip
                            title={"Copied"}
                            open={showCopyPassTooltip}
                            arrow
                          >
                            <IconButton
                              onClick={onClickCopyPass}
                              sx={{ padding: 0, width: 40, height: 40 }}
                            >
                              <CopyIcon />
                            </IconButton>
                          </Tooltip>
                        </React.Fragment>,
                      ]
                    : null
                }
                InputProps={{
                  readOnly: isRandomFirstPassword,
                }}
              />
              {!error?.message && !hidePasswordStrong && (
                <Stack
                  marginTop={"5px!important"}
                  marginBottom={"-5px!important"}
                  id={"password-strength-bar-container"}
                >
                  <PasswordStrengthBar
                    password={field.value as string}
                    shortScoreWord={"too weak"}
                    scoreWordStyle={{
                      fontSize: 14,
                      fontFamily: `DM Sans, "san serif"`,
                    }}
                  />
                </Stack>
              )}
            </>
          )}
        />

        {confirmPasswordName && (
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
              <TextFieldWithShowPassword
                canShowPassword={
                  isRandomSecondPassword ? false : canShowPassword
                }
                label={labelConfirm}
                size={"small"}
                type={isRandomSecondPassword ? "text" : "password"}
                overrideType={isRandomSecondPassword}
                error={!!error || !!errorConfirm}
                helperText={error?.message || errorConfirm}
                {...field}
                endAdornments={
                  isRandomSecondPassword
                    ? [
                        <React.Fragment key={"second-password-copy-button"}>
                          <Tooltip
                            title={"Copied"}
                            open={showCopyConfirmTooltip}
                            arrow
                          >
                            <IconButton
                              onClick={onClickCopyConfirm}
                              sx={{ padding: 0, width: 40, height: 40 }}
                            >
                              <CopyIcon />
                            </IconButton>
                          </Tooltip>
                        </React.Fragment>,
                      ]
                    : null
                }
                InputProps={{
                  readOnly: isRandomSecondPassword,
                }}
              />
            )}
          />
        )}
      </Stack>
    );
  }, [
    autofocusPassword,
    horizontal,
    canShowPassword,
    inputsContainerProps,
    errorPassword,
    errorConfirm,
    passwordName,
    confirmPasswordName,
    passwordAndConfirmEquals,
    labelPassword,
    labelConfirm,
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
