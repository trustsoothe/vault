import type {
  SerializedAccountReference,
  SerializedAsset,
} from "@poktscan/keyring";
import type { RootState } from "../../redux/store";
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
import { connect } from "react-redux";
import CircularLoading from "../common/CircularLoading";
import AutocompleteAsset from "./AutocompleteAsset";
import OperationFailed from "../common/OperationFailed";
import { nameRules } from "./CreateNew";
import AccountAndVaultPasswords from "../common/AccountAndVaultPasswords";
import AppToBackground from "../../controllers/communication/AppToBackground";
import { ACCOUNTS_PAGE } from "../../constants/routes";
import {
  getAddressFromPrivateKey,
  getPrivateKeyFromPPK,
  isValidPPK,
  protocolsAreEquals,
} from "../../utils/networkOperations";
import { isPrivateKey } from "../../utils";
import { enqueueSnackbar } from "../../utils/ui";
import AccountsAutocomplete from "./Autocomplete";

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
  asset?: SerializedAsset;
}

const getPrivateKey = async (data: FormValues) => {
  let privateKey: string;

  if (data.json_file) {
    const contentFile = await data.json_file.text();

    privateKey = await getPrivateKeyFromPPK(contentFile, data.file_password);
  } else {
    privateKey = data.private_key;
  }

  return privateKey;
};

type FormStatus = "normal" | "loading" | "error" | "account_exists";

interface ImportAccountProps {
  accounts: RootState["vault"]["entities"]["accounts"]["list"];
  assets: RootState["vault"]["entities"]["assets"]["list"];
  passwordRemembered: RootState["vault"]["passwordRemembered"];
}

const ImportAccount: React.FC<ImportAccountProps> = ({
  passwordRemembered,
  accounts,
  assets,
}) => {
  const theme = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();
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
      asset: null,
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

  const onChangeAccount = useCallback(
    (newAccount: SerializedAccountReference) => {
      setAccountToReImport(newAccount);
      setSearchParams((prev) => {
        prev.set("id", newAccount.id);
        return prev;
      });
    },
    []
  );

  useEffect(() => {
    const id = searchParams.get("reimport");
    const accountFromStore = accounts.find((item) => item.id === id);
    if (accountFromStore && accountToReimport?.id !== id) {
      setAccountToReImport(accountFromStore);

      const asset = assets.find((item) =>
        protocolsAreEquals(item.protocol, accountFromStore.protocol)
      );

      setValue("asset", asset);
      setValue("account_name", accountFromStore.name);
      return;
    }

    if (!accountFromStore) {
      setAccountToReImport(null);
    }
  }, [searchParams, accounts]);

  const [type, asset, file_password, json_file, vault_password] = watch([
    "import_type",
    "asset",
    "file_password",
    "json_file",
    "vault_password",
  ]);

  useEffect(() => {
    setValue("private_key", "");
    setValue("json_file", null);
    setValue("file_password", "");
    clearErrors(["private_key", "json_file"]);
  }, [type]);

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
        privateKey = await getPrivateKey(data);
      } catch (e) {
        if (e?.message === "Unsupported state or unable to authenticate data") {
          setWrongFilePassword(true);
        } else {
          setErrorPpk(true);
        }
        setStatus("normal");
        return;
      }

      AppToBackground.importAccount({
        accountData: {
          asset: data.asset,
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
              data.asset.protocol
            );

            const account = accounts.find(
              (item) =>
                item.address === address &&
                protocolsAreEquals(item.protocol, data.asset.protocol)
            );
            setAccountToReImport(account);
            setStatus("account_exists");
          } else {
            enqueueSnackbar({
              message: `Account ${
                accountToReimport ? "re" : ""
              }imported successfully.`,
              variant: "success",
            });
            navigate(ACCOUNTS_PAGE);
          }
        }
      });
    },
    [navigate, accountToReimport, passwordStep, passwordRemembered]
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
          cancelBtnText={"Go To Account"}
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
          {accountToReimport ? (
            <AccountsAutocomplete
              selectedAccount={accountToReimport}
              onChangeSelectedAccount={onChangeAccount}
            />
          ) : (
            <>
              <AutocompleteAsset
                control={control}
                textFieldProps={{ autoFocus: true }}
              />
              <TextField
                fullWidth
                label={"Account Name"}
                autoComplete={"off"}
                size={"small"}
                {...register("account_name", nameRules)}
                error={!!formState?.errors?.account_name}
                helperText={formState?.errors?.account_name?.message}
              />
            </>
          )}

          <Divider
            sx={{ marginTop: accountToReimport ? "10px!important" : undefined }}
          />

          <Stack
            direction={"row"}
            justifyContent={"space-between"}
            alignItems={"center"}
            width={1}
            height={30}
            marginTop={"15px!important"}
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
                  disabled={!asset}
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
              disabled={!asset}
              {...register("private_key", {
                validate: async (value, formValues) => {
                  if (formValues.import_type === "private_key") {
                    if (!value) {
                      return "Required";
                    }

                    if (!isPrivateKey(value)) {
                      return "Invalid Private Key";
                    }

                    if (accountToReimport && formValues.asset) {
                      const addressOfPrivateKey =
                        await getAddressFromPrivateKey(
                          value,
                          formValues.asset.protocol
                        );

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

                      if (!isValidPPK(content)) {
                        return "File is not valid";
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
                      color={
                        error
                          ? theme.customColors.red100
                          : theme.customColors.dark75
                      }
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
                        color: theme.customColors.primary500,
                        "&:hover": {
                          textDecoration: "underline",
                          backgroundColor: theme.customColors.dark2,
                        },
                      }}
                    >
                      Select File
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

const mapStateToProps = (state: RootState) => {
  return {
    accounts: state.vault.entities.accounts.list,
    assets: state.vault.entities.assets.list,
    passwordRemembered: state.vault.passwordRemembered,
  };
};

export default connect(mapStateToProps)(ImportAccount);
