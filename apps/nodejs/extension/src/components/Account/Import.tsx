import type {
  SerializedAccountReference,
  SupportedProtocols,
} from "@poktscan/keyring";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import Typography from "@mui/material/Typography";
import { styled, useTheme } from "@mui/material";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Divider from "@mui/material/Divider";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import CircularLoading from "../common/CircularLoading";
import OperationFailed from "../common/OperationFailed";
import { nameRules } from "./CreateNew";
import AccountAndVaultPasswords from "../common/AccountAndVaultPasswords";
import AppToBackground from "../../controllers/communication/AppToBackground";
import { ACCOUNTS_PAGE } from "../../constants/routes";
import {
  getAddressFromPrivateKey,
  getPrivateKeyFromPPK,
  isValidPPK,
  isValidPrivateKey,
} from "../../utils/networkOperations";
import { enqueueSnackbar } from "../../utils/ui";
import { useAppDispatch, useAppSelector } from "../../hooks/redux";
import { changeSelectedAccountOfNetwork } from "../../redux/slices/app";

const VisuallyHiddenInput = styled("input")({
  clip: "rect(0 0 0 0)",
  clipPath: "inset(50%)",
  height: 1,
  overflow: "hidden",
  position: "absolute",
  bottom: 0,
  left: 0,
  whiteSpace: "nowrap",
  width: 1,
});

interface FormValues {
  import_type: "private_key" | "json_file";
  private_key?: string;
  json_file?: File | null;
  file_password?: string;
  account_name: string;
  account_password: string;
  confirm_account_password: string;
  vault_password: string;
}

const INVALID_PPK_MESSAGE = "File is not valid";

const getPrivateKey = async (
  data: FormValues,
  protocol: SupportedProtocols
) => {
  let privateKey: string;

  if (data.json_file) {
    const contentFile = await data.json_file.text();

    privateKey = await getPrivateKeyFromPPK(
      contentFile,
      data.file_password,
      protocol
    );
  } else {
    privateKey = data.private_key;
  }

  return privateKey;
};

type FormStatus = "normal" | "loading" | "error" | "account_exists";

const ImportAccount: React.FC = () => {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const selectedProtocol = useAppSelector((state) => state.app.selectedNetwork);
  const passwordRemembered = useAppSelector(
    (state) => state.vault.passwordRemembered
  );
  const accounts = useAppSelector(
    (state) => state.vault.entities.accounts.list
  );
  const selectedAccount = useAppSelector((state) => {
    const selectedNetwork = state.app.selectedNetwork;
    const selectedAccountId =
      state.app.selectedAccountByNetwork[selectedNetwork];

    return state.vault.entities.accounts.list.find(
      (account) => account.id === selectedAccountId
    );
  });

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [accountToReimport, setAccountToReImport] =
    useState<SerializedAccountReference>(null);

  const [status, setStatus] = useState<FormStatus>("normal");
  const [passwordStep, setPasswordStep] = useState<"account" | "vault">(
    "account"
  );
  const [wrongPassword, setWrongPassword] = useState(false);
  const [wrongFilePassword, setWrongFilePassword] = useState(false);
  const [errorPpk, setErrorPpk] = useState(false);

  const methods = useForm<FormValues>({
    defaultValues: {
      import_type: "private_key",
      private_key: "",
      json_file: null,
      file_password: "",
      account_name: "",
      account_password: "",
      confirm_account_password: "",
      vault_password: "",
    },
  });
  const {
    register,
    control,
    handleSubmit,
    formState,
    watch,
    clearErrors,
    setValue,
    getValues,
  } = methods;

  const { isValidating } = formState;

  useEffect(() => {
    const isReimporting = searchParams.get("reimport") === "true";
    if (
      isReimporting &&
      selectedAccount &&
      accountToReimport?.id !== selectedAccount.id
    ) {
      setAccountToReImport({ ...selectedAccount });

      setValue("account_name", selectedAccount.name);
      return;
    }

    if (!selectedAccount || !isReimporting) {
      setAccountToReImport(null);
    }
  }, [selectedAccount]);

  const [type, file_password, json_file, vault_password] = watch([
    "import_type",
    "file_password",
    "json_file",
    "vault_password",
  ]);

  useEffect(() => {
    setValue("private_key", "");
    setValue("json_file", null);
    setValue("file_password", "");
    clearErrors(["private_key", "json_file"]);
    setWrongFilePassword(false);
  }, [type, selectedProtocol]);

  useEffect(() => {
    if (wrongPassword) {
      setWrongPassword(false);
    }
  }, [vault_password]);

  useEffect(() => {
    if (wrongFilePassword) {
      setWrongFilePassword(false);
    }
  }, [file_password]);

  useEffect(() => {
    if (errorPpk) {
      setErrorPpk(false);
    }
  }, [json_file]);

  const onClickCancel = useCallback(() => {
    if (passwordStep === "vault") {
      setPasswordStep("account");
      return;
    }
    if (location.key !== "default") {
      navigate(-1);
    } else {
      navigate("/");
    }
  }, [navigate, location, passwordStep]);

  const onClickCreate = useCallback(
    async (data: FormValues) => {
      if (!passwordRemembered && passwordStep === "account") {
        setPasswordStep("vault");
        return;
      }

      setStatus("loading");

      let privateKey: string;
      try {
        privateKey = await getPrivateKey(data, selectedProtocol);
      } catch (e) {
        if (
          e?.message === "Unsupported state or unable to authenticate data" ||
          e?.message === "Key derivation failed - possibly wrong password"
        ) {
          setWrongFilePassword(true);
        } else {
          setErrorPpk(true);
        }
        setStatus("normal");
        return;
      }

      AppToBackground.importAccount({
        accountData: {
          protocol: selectedProtocol,
          name: data.account_name,
          accountPassword: data.account_password,
          privateKey,
        },
        replace: !!accountToReimport,
        vaultPassword: passwordRemembered ? undefined : data.vault_password,
      }).then(async (response) => {
        if (response.error) {
          setStatus("error");
        } else {
          if (response.data.isPasswordWrong) {
            setWrongPassword(true);
            setStatus("normal");
          } else if (response.data.accountAlreadyExists) {
            const address = await getAddressFromPrivateKey(
              privateKey,
              selectedProtocol
            );

            const account = accounts.find(
              (item) =>
                item.address === address && item.protocol === selectedProtocol
            );
            setAccountToReImport(account);
            setStatus("account_exists");
          } else {
            dispatch(
              changeSelectedAccountOfNetwork({
                network: selectedProtocol,
                accountId: response.data.accountId,
              })
            ).then(() => {
              setTimeout(() => {
                enqueueSnackbar({
                  message: `Account ${
                    accountToReimport ? "re" : ""
                  }imported successfully.`,
                  variant: "success",
                });
                navigate(ACCOUNTS_PAGE);
              }, 500);
            });
          }
        }
      });
    },
    [
      navigate,
      accountToReimport,
      passwordStep,
      passwordRemembered,
      selectedProtocol,
      dispatch,
      accounts,
    ]
  );

  const onClickAccountExists = useCallback(async () => {
    navigate(ACCOUNTS_PAGE);
  }, [navigate]);

  const onClickReimport = useCallback(() => {
    handleSubmit(onClickCreate)();
  }, [handleSubmit, onClickCreate]);

  const content = useMemo(() => {
    if (status === "loading") {
      return <CircularLoading />;
    }

    if (status === "error") {
      return (
        <OperationFailed
          text={"There was an error importing the account."}
          onCancel={onClickCancel}
        />
      );
    }

    if (status === "account_exists") {
      return (
        <OperationFailed
          text={"This account already exists."}
          retryBtnProps={{
            type: "button",
            sx: {
              width: 130,
            },
          }}
          cancelBtnProps={{
            sx: {
              width: 130,
            },
          }}
          onCancel={onClickAccountExists}
          cancelBtnText={"Cancel"}
          retryBtnText={"Reimport"}
          onRetry={onClickReimport}
          buttonsContainerProps={{
            width: 275,
          }}
        />
      );
    }

    return (
      <Stack
        height={1}
        width={1}
        justifyContent={"space-between"}
        sx={{
          position: "relative",
        }}
      >
        <Stack
          spacing={2}
          height={1}
          width={1}
          marginTop={1.5}
          paddingTop={0.5}
          boxSizing={"border-box"}
          overflow={"hidden"}
        >
          {!accountToReimport && (
            <>
              <TextField
                fullWidth
                label={"Account Name"}
                autoComplete={"off"}
                size={"small"}
                {...register("account_name", nameRules)}
                error={!!formState?.errors?.account_name}
                helperText={formState?.errors?.account_name?.message}
              />
              <Divider />
            </>
          )}

          <Stack
            direction={"row"}
            justifyContent={"space-between"}
            alignItems={"center"}
            width={1}
            height={30}
            marginTop={accountToReimport ? undefined : "15px!important"}
          >
            <Typography fontSize={14} fontWeight={500} letterSpacing={"0.5px"}>
              Import from
            </Typography>
            <Controller
              control={control}
              name={"import_type"}
              render={({ field }) => (
                <TextField
                  select
                  size={"small"}
                  placeholder={"Type"}
                  SelectProps={{
                    MenuProps: {
                      sx: {
                        "& .MuiMenuItem-root": {
                          fontSize: 12,
                        },
                      },
                    },
                  }}
                  sx={{
                    width: 140,
                    backgroundColor: theme.customColors.dark2,
                    minHeight: 30,
                    maxHeight: 30,
                    height: 30,
                    "& .MuiSelect-select": {
                      fontSize: "12px!important",
                    },
                    "& .MuiInputBase-root": {
                      paddingTop: 0.3,
                      minHeight: 30,
                      maxHeight: 30,
                      height: 30,
                      "& input": {
                        minHeight: 30,
                        maxHeight: 30,
                        height: 30,
                      },
                    },
                  }}
                  {...field}
                >
                  <MenuItem value={"private_key"}>Private Key</MenuItem>
                  <MenuItem value={"json_file"}>Portable Wallet</MenuItem>
                </TextField>
              )}
            />
          </Stack>

          {type === "private_key" ? (
            <TextField
              label={"Private Key"}
              size={"small"}
              fullWidth
              autoComplete={"off"}
              {...register("private_key", {
                validate: async (value, formValues) => {
                  if (formValues.import_type === "private_key") {
                    if (!value) {
                      return "Required";
                    }

                    if (!isValidPrivateKey(value, selectedProtocol)) {
                      return "Invalid Private Key";
                    }

                    if (accountToReimport) {
                      const addressOfPrivateKey =
                        await getAddressFromPrivateKey(value, selectedProtocol);

                      if (accountToReimport.address !== addressOfPrivateKey) {
                        return "This is not the PK of the account to reimport";
                      }
                    }
                  }

                  return true;
                },
              })}
              error={!!formState?.errors?.private_key}
              helperText={formState?.errors?.private_key?.message}
              sx={{
                marginTop: "10px!important",
              }}
            />
          ) : (
            <Stack spacing={1} width={1} marginTop={"10px!important"}>
              <Controller
                control={control}
                name={"json_file"}
                rules={{
                  validate: async (value, formValues) => {
                    if (formValues.import_type === "json_file") {
                      if (!value) {
                        return "Required";
                      }

                      const content = await value.text();

                      if (!isValidPPK(content, selectedProtocol)) {
                        return INVALID_PPK_MESSAGE;
                      }

                      if (accountToReimport) {
                        try {
                          const ppkContent = await value.text();
                          const privateKey = await getPrivateKeyFromPPK(
                            ppkContent,
                            formValues.file_password,
                            selectedProtocol
                          );
                          const addressOfPrivateKey =
                            await getAddressFromPrivateKey(
                              privateKey,
                              selectedProtocol
                            );

                          if (
                            accountToReimport.address !== addressOfPrivateKey
                          ) {
                            return INVALID_PPK_MESSAGE;
                          }
                        } catch (e) {}
                      }
                    }

                    return true;
                  },
                }}
                render={({ field, fieldState: { error } }) => (
                  <Stack
                    direction={"row"}
                    spacing={"5px"}
                    alignItems={"center"}
                    height={30}
                    paddingX={1}
                    bgcolor={theme.customColors.dark2}
                    justifyContent={"space-between"}
                  >
                    <Typography
                      fontSize={12}
                      textOverflow={"ellipsis"}
                      whiteSpace={"nowrap"}
                      overflow={"hidden"}
                      color={
                        error
                          ? theme.customColors.red100
                          : theme.customColors.dark75
                      }
                      sx={{
                        maxWidth: 165,
                        marginRight: 0.5,
                      }}
                    >
                      {json_file?.name || "None File Selected"}
                    </Typography>
                    <Button
                      variant={"text"}
                      component={"label"}
                      disableRipple={true}
                      disableFocusRipple={true}
                      sx={{
                        height: 30,
                        textDecoration: "underline",
                        justifyContent: "flex-end",
                        paddingX: 0,
                        fontSize: 13,
                        color: error
                          ? theme.customColors.red100
                          : theme.customColors.primary500,
                        "&:hover": {
                          textDecoration: "underline",
                          backgroundColor: theme.customColors.dark2,
                        },
                      }}
                    >
                      {error?.message === INVALID_PPK_MESSAGE
                        ? "Wrong File. Select Another"
                        : "Select File"}
                      <VisuallyHiddenInput
                        type={"file"}
                        accept={"application/json"}
                        {...field}
                        //@ts-ignore
                        value={field?.value?.fileName}
                        onChange={(event) => {
                          field.onChange(event?.target?.files?.[0] || null);
                        }}
                      />
                    </Button>
                  </Stack>
                )}
              />

              <TextField
                fullWidth
                label={"File Password (Optional)"}
                size={"small"}
                type={"password"}
                error={wrongFilePassword}
                helperText={wrongFilePassword ? "Invalid password" : undefined}
                sx={{
                  marginTop: "10px!important",
                }}
                {...register("file_password")}
              />
            </Stack>
          )}

          <FormProvider {...methods}>
            <AccountAndVaultPasswords
              introduceVaultPassword={passwordStep === "vault"}
              vaultPasswordTitle={`To save the account, introduce the vault’s password:`}
              accountRandomKey={"import-acc"}
              vaultTitleProps={{
                marginTop: `20px!important`,
                marginBottom: "5px!important",
              }}
              vaultPasswordIsWrong={wrongPassword}
              dividerProps={{
                sx: {
                  marginTop: `15px!important`,
                },
              }}
              passwordContainerProps={{
                marginTop: "10px!important",
                sx: {
                  ...(type === "json_file" && {
                    "& #password-strength-bar-container": {
                      marginBottom: "-11px!important",
                    },
                  }),
                },
              }}
            />
          </FormProvider>
        </Stack>
        <Stack direction={"row"} spacing={2} width={1} marginTop={2}>
          <Button
            onClick={onClickCancel}
            sx={{
              fontWeight: 700,
              color: theme.customColors.dark50,
              borderColor: theme.customColors.dark50,
              height: 36,
              borderWidth: 1.5,
              fontSize: 16,
            }}
            variant={"outlined"}
            fullWidth
          >
            {!passwordRemembered && passwordStep === "vault"
              ? "Back"
              : "Cancel"}
          </Button>
          <Button
            sx={{
              fontWeight: 700,
              height: 36,
              fontSize: 16,
            }}
            variant={"contained"}
            fullWidth
            type={"submit"}
            disabled={isValidating}
          >
            {!passwordRemembered && passwordStep === "account"
              ? "Next"
              : "Import"}
          </Button>
        </Stack>
      </Stack>
    );
  }, [
    theme,
    errorPpk,
    wrongFilePassword,
    accountToReimport,
    register,
    control,
    onClickCancel,
    type,
    status,
    getValues,
    formState,
    methods,
    passwordRemembered,
    navigate,
    isValidating,
    onClickAccountExists,
    wrongPassword,
    passwordStep,
  ]);

  return (
    <Stack
      component={"form"}
      onSubmit={handleSubmit(onClickCreate)}
      alignItems={"center"}
      justifyContent={"center"}
      height={1}
      width={1}
      boxSizing={"border-box"}
    >
      {content}
    </Stack>
  );
};

export default ImportAccount;
