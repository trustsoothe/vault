import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Controller, type PathValue, useFormContext } from "react-hook-form";
import PasswordStrengthBar from "react-password-strength-bar";
import Stack, { type StackProps } from "@mui/material/Stack";
import IconButton from "@mui/material/IconButton";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Button from "@mui/material/Button";
import Grow from "@mui/material/Grow";
import Popper from "@mui/material/Popper";
import Switch from "@mui/material/Switch";
import Typography from "@mui/material/Typography";
import SettingsIcon from "@mui/icons-material/Settings";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { type TextFieldProps, useTheme } from "@mui/material";
import ClickAwayListener from "@mui/material/ClickAwayListener";
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
  inputsDisabled?: boolean;
}

interface TextFieldWithShowPasswordProps
  extends Omit<TextFieldProps<"outlined">, "variant"> {
  canShowPassword?: boolean;
  overrideType?: boolean;
  endAdornments?: React.ReactNode[];
}

const TextFieldWithShowPassword: React.FC<TextFieldWithShowPasswordProps> =
  React.forwardRef(
    (
      {
        canShowPassword = true,
        overrideType = false,
        endAdornments,
        disabled,
        ...others
      },
      ref
    ) => {
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
              disabled={disabled}
              tabIndex={-1}
            >
              {showPassword ? (
                <VisibilityOffIcon sx={{ fontSize: 18 }} />
              ) : (
                <VisibilityIcon sx={{ fontSize: 18 }} />
              )}
            </IconButton>
          );
        }

        return (
          <Stack direction={"row"}>{adornments.map((item) => item)}</Stack>
        );
      }, [
        endAdornments,
        showPassword,
        canShowPassword,
        toggleShowPassword,
        disabled,
      ]);

      return (
        <TextField
          size={"small"}
          variant={"outlined"}
          required
          {...others}
          inputRef={ref}
          type={showPassword && canShowPassword ? "text" : "password"}
          InputProps={{
            endAdornment: endAdornment,
            ...others?.InputProps,
          }}
          disabled={disabled}
          {...(overrideType && {
            type: others.type,
          })}
        />
      );
    }
  );

const getRandomUnits = (input: number | string, randomWords: boolean) => {
  const min = randomWords ? 2 : 8;
  const max = randomWords ? 8 : 40;
  const defaultUnits = randomWords ? 4 : 12;

  const numberOnInput = Number(input);

  let units: number;
  if (isNaN(numberOnInput)) {
    units = defaultUnits;
  } else if (numberOnInput >= min && numberOnInput <= max) {
    units = numberOnInput;
  } else if (numberOnInput < min) {
    units = min;
  } else {
    units = max;
  }

  return units.toString();
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
  inputsDisabled = false,
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
  const [anchorConfigRandomMenu, setAnchorConfigRandomMenu] =
    useState<HTMLButtonElement | null>(null);
  // random units refers to digits when words is disabled and number of words when words is enabled
  const [randomUnits, setRandomUnits] = useState("12");
  const [randomWords, setRandomWords] = useState(false);
  const [pass, confirm] = watch([passwordName, confirmPasswordName]);
  const preventChangeRandom = useRef(false);

  useEffect(() => {
    if (randomKey) {
      try {
        const randomObj = JSON.parse(localStorage.getItem(randomKey) || "{}");

        const wasRandom = randomObj.random;
        const units = randomObj.units;
        const words = !!randomObj.words;

        if (wasRandom) {
          if (
            passwordName &&
            (canGenerateRandomFirst || canGenerateRandomSecond)
          ) {
            try {
              const pass = getValues(passwordName);
              verifyPassword(pass as unknown as string);
              setValue(passwordName, pass);

              if (confirmPasswordName && canGenerateRandomSecond) {
                const confirm = getValues(confirmPasswordName);
                if (confirm) {
                  verifyPassword(confirm as unknown as string);
                  setValue(confirmPasswordName, confirm);
                }
              }

              setRandom(true);
              preventChangeRandom.current = true;
              setRandomWords(words);
              setRandomUnits(getRandomUnits(units, words));
              return;
            } catch (e) {}
          }

          localStorage.removeItem(randomKey);
        }
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    if (preventChangeRandom.current) {
      preventChangeRandom.current = false;
      return;
    }

    if (random) {
      if (canGenerateRandomFirst) {
        setValue(
          passwordName,
          generateRandomPassword(Number(randomUnits), randomWords) as PathValue<
            any,
            any
          >
        );
      }

      if (confirmPasswordName && canGenerateRandomSecond) {
        if (!passwordAndConfirmEquals) {
          setValue(
            confirmPasswordName,
            generateRandomPassword(
              Number(randomUnits),
              randomWords
            ) as PathValue<any, any>
          );
        }
      } else if (confirmPasswordName) {
        setValue(confirmPasswordName, "" as PathValue<any, any>);
      }

      localStorage.setItem(
        randomKey,
        JSON.stringify({
          random: random,
          units: randomUnits,
          words: randomWords,
        })
      );
    }
  }, [randomUnits]);

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
      if (confirmPasswordName) {
        setValue(confirmPasswordName, "" as PathValue<any, any>);
      }

      if (newRandom) {
        const pass = generateRandomPassword(
          Number(randomUnits),
          randomWords
        ) as PathValue<any, any>;
        if (canGenerateRandomFirst) {
          setValue(passwordName, pass);
          setFocus(passwordName);
        }
        if (confirmPasswordName && canGenerateRandomSecond) {
          if (!passwordAndConfirmEquals) {
            setValue(
              confirmPasswordName,
              generateRandomPassword(
                Number(randomUnits),
                randomWords
              ) as PathValue<any, any>
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
        localStorage.setItem(
          randomKey,
          JSON.stringify({
            random: newRandom,
            units: randomUnits,
            words: randomWords,
          })
        );
      }
      setRandom(newRandom);
      setAnchorConfigRandomMenu(null);
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
    randomUnits,
    randomWords,
  ]);

  const regenerateRandomPassword = useCallback(() => {
    if (random) {
      const units = Number(randomUnits);
      const pass = generateRandomPassword(units, randomWords) as PathValue<
        any,
        any
      >;
      if (canGenerateRandomFirst) {
        setValue(passwordName, pass);
        setFocus(passwordName);
      }
      if (confirmPasswordName && canGenerateRandomSecond) {
        if (!passwordAndConfirmEquals) {
          setValue(
            confirmPasswordName,
            generateRandomPassword(units, randomWords) as PathValue<any, any>
          );
        }
      } else if (confirmPasswordName) {
        setValue(confirmPasswordName, "" as PathValue<any, any>);
      }
    }
  }, [
    randomUnits,
    randomWords,
    random,
    canGenerateRandomFirst,
    passwordName,
    confirmPasswordName,
    canGenerateRandomSecond,
    passwordAndConfirmEquals,
  ]);

  const openConfigRandomMenu = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      setAnchorConfigRandomMenu(event.currentTarget);
    },
    []
  );

  const closeConfigRandomMenu = useCallback(() => {
    setAnchorConfigRandomMenu(null);
  }, []);

  const onChangeRandomUnits = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const numberOnInput = event.target.value;

      setRandomUnits(getRandomUnits(numberOnInput, randomWords));
    },
    [randomWords]
  );

  const onChangeRandomWords = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = event.target.checked;
      setRandomWords(newValue);
      setRandomUnits(newValue ? "4" : "12");
    },
    []
  );

  const actions = useMemo(() => {
    if (!canGenerateRandomSecond && !canGenerateRandomFirst) return null;

    return (
      <Stack
        direction={"row"}
        alignItems={"center"}
        marginBottom={"-15px"}
        justifyContent={"flex-end"}
      >
        {(canGenerateRandomSecond || canGenerateRandomFirst) && (
          <>
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
              disabled={!!anchorConfigRandomMenu}
              tabIndex={-1}
              onClick={toggleRandomPassword}
            >
              {random ? "Type password" : "Generate random"}
            </Button>
            {random && (
              <IconButton onClick={openConfigRandomMenu}>
                <SettingsIcon sx={{ fontSize: 20 }} />
              </IconButton>
            )}
          </>
        )}
      </Stack>
    );
  }, [
    toggleRandomPassword,
    openConfigRandomMenu,
    canGenerateRandomSecond,
    canGenerateRandomFirst,
    anchorConfigRandomMenu,
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
                disabled={inputsDisabled}
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
                              disabled={inputsDisabled}
                              onClick={onClickCopyPass}
                              tabIndex={-1}
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
                    shortScoreWord={field.value ? "too short" : ""}
                    minLength={8}
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
                disabled={inputsDisabled}
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
                              disabled={inputsDisabled}
                              sx={{ padding: 0, width: 40, height: 40 }}
                              tabIndex={-1}
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
    inputsDisabled,
    canGenerateRandomFirst,
  ]);

  return (
    <Stack spacing={"15px"} {...containerProps}>
      {actions}
      {content}
      <Popper
        open={!!anchorConfigRandomMenu}
        transition
        anchorEl={anchorConfigRandomMenu}
        placement={"left-start"}
        sx={{
          zIndex: Math.max(...Object.values(theme.zIndex)) + 2,
        }}
      >
        {({ TransitionProps }) => (
          <ClickAwayListener onClickAway={closeConfigRandomMenu}>
            <Grow {...TransitionProps}>
              <Stack
                width={110}
                height={110}
                paddingX={1}
                spacing={0.5}
                paddingY={0.5}
                borderRadius={"8px"}
                boxSizing={"border-box"}
                bgcolor={theme.customColors.white}
                border={`1px solid ${theme.customColors.dark15}`}
              >
                <Stack
                  direction={"row"}
                  height={30}
                  alignItems={"center"}
                  spacing={0.7}
                >
                  <Typography fontSize={12} color={theme.customColors.dark75}>
                    length:
                  </Typography>
                  <TextField
                    value={randomUnits}
                    onChange={onChangeRandomUnits}
                    type={"number"}
                    sx={{
                      width: 42,
                      height: 20,
                      "& .MuiInputBase-root": {
                        height: 20,
                      },
                      "& input": {
                        height: "20px!important",
                        fontSize: "12px!important",
                        marginRight: -0.9,
                        marginLeft: -0.3,
                      },
                    }}
                  />
                </Stack>
                <Stack
                  direction={"row"}
                  height={30}
                  alignItems={"center"}
                  spacing={0.7}
                >
                  <Typography fontSize={12} color={theme.customColors.dark75}>
                    words:
                  </Typography>
                  <Switch
                    size={"small"}
                    checked={randomWords}
                    onChange={onChangeRandomWords}
                  />
                </Stack>
                <Button
                  sx={{
                    width: 84,
                    height: 26,
                    fontSize: 13,
                  }}
                  onClick={regenerateRandomPassword}
                >
                  Regenerate
                </Button>
              </Stack>
            </Grow>
          </ClickAwayListener>
        )}
      </Popper>
    </Stack>
  );
};

export default Password;
