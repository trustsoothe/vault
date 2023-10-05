import type {
  SerializedAccountReference,
  SerializedAsset,
} from "@poktscan/keyring";
import type { RootState } from "../../redux/store";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Divider from "@mui/material/Divider";
import { enqueueSnackbar } from "notistack";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import { connect } from "react-redux";
import CircularLoading from "../common/CircularLoading";
import AutocompleteAsset from "./AutocompleteAsset";
import OperationFailed from "../common/OperationFailed";
import { nameRules } from "./CreateNew";
import Password from "../common/Password";
import AppToBackground from "../../controllers/communication/AppToBackground";
import { ACCOUNTS_DETAIL_PAGE, ACCOUNTS_PAGE } from "../../constants/routes";
import { DetailComponent } from "./AccountDetail";
import {
  getAddressFromPrivateKey,
  getPrivateKeyFromPPK,
  isValidPPK,
  protocolsAreEquals,
} from "../../utils/networkOperations";
import { isPrivateKey } from "../../utils";

interface FormValues {
  import_type: "private_key" | "json_file";
  private_key?: string;
  json_file?: File | null;
  file_password?: string;
  account_name: string;
  password: string;
  confirm_password: string;
  vault_password: string;
  asset?: SerializedAsset;
}

const getPrivateKey = async (data: FormValues) => {
  let privateKey: string;

  if (data.json_file) {
    const contentFile = await data.json_file.text();

    privateKey = getPrivateKeyFromPPK(contentFile, data.file_password);
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
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [accountToReimport, setAccountToReImport] =
    useState<SerializedAccountReference>(null);

  const [status, setStatus] = useState<FormStatus>("normal");
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
      password: "",
      confirm_password: "",
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

  const [type, asset, file_password, json_file] = watch([
    "import_type",
    "asset",
    "file_password",
    "json_file",
  ]);

  useEffect(() => {
    setValue("private_key", "");
    setValue("json_file", null);
    setValue("file_password", "");
    clearErrors(["private_key", "json_file"]);
  }, [type]);

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
    if (location.key !== "default") {
      navigate(-1);
    } else {
      navigate("/");
    }
  }, [navigate, location]);

  const onClickCreate = useCallback(
    async (data: FormValues) => {
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
          accountPassword: data.password,
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
              style: { width: 200, minWidth: "200px!important" },
              message: `Account ${
                accountToReimport ? "re" : ""
              }imported successfully.`,
              variant: "success",
              autoHideDuration: 2500,
            });
            navigate(`${ACCOUNTS_DETAIL_PAGE}?id=${response.data.accountId}`);
          }
        }
      });
    },
    [navigate, accountToReimport]
  );

  const onClickAccountExists = useCallback(async () => {
    let route: string;

    try {
      if (status === "account_exists") {
        if (accountToReimport) {
          route = `${ACCOUNTS_DETAIL_PAGE}?id=${accountToReimport.id}`;
        } else {
          route = ACCOUNTS_PAGE;
        }
      } else {
        route = ACCOUNTS_PAGE;
      }
    } catch (e) {
      route = ACCOUNTS_PAGE;
    }

    navigate(route);
  }, [status, accounts, getValues, navigate, accountToReimport]);

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
          maxHeight={"calc(100% - 50px)"}
          flexGrow={1}
          spacing={2.3}
          width={"calc(100%  + 10px)"}
          pt={1.5}
          boxSizing={"border-box"}
          sx={{ overflowY: "auto", overflowX: "hidden" }}
          paddingRight={1}
        >
          {accountToReimport ? (
            <Stack position={"relative"}>
              <Typography
                sx={{
                  fontSize: 14,
                  transform: "scale(0.75)",
                  color: "rgba(0, 0, 0, 0.6)",
                  position: "absolute",
                  left: -7,
                  top: -15,
                  zIndex: 2,
                  backgroundColor: "white",
                  paddingX: "7px",
                  letterSpacing: "0.5px",
                }}
              >
                Account to Reimport
              </Typography>
              <Stack
                sx={{
                  border: "1px solid lightgray",
                  padding: 0.5,
                  boxSizing: "border-box",
                  borderRadius: "6px",
                  width: 1,
                  justifyContent: "center",
                  alignItems: "center",
                  marginTop: "-4px!important",
                }}
              >
                <DetailComponent
                  account={accountToReimport}
                  hideCopy={true}
                  containerProps={{
                    my: "0px!important",
                    sx: {
                      transform: "scale(0.9)",
                      width: 1,
                    },
                  }}
                />
              </Stack>
            </Stack>
          ) : (
            <>
              <AutocompleteAsset
                control={control}
                autocompleteProps={{ openOnFocus: true }}
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
            sx={{
              width: "calc(100% + 5px)",
              marginLeft: "-5px",
              marginTop: accountToReimport ? "15px!important" : undefined,
            }}
            orientation={"horizontal"}
          />

          <Stack
            direction={"row"}
            justifyContent={"space-between"}
            alignItems={"center"}
            width={1}
            height={30}
            marginTop={accountToReimport ? "20px!important" : "15px!important"}
          >
            <Typography fontSize={14}>Import from</Typography>
            <Controller
              control={control}
              name={"import_type"}
              render={({ field }) => (
                <TextField
                  select
                  size={"small"}
                  placeholder={"Type"}
                  disabled={!asset}
                  sx={{
                    width: 145,
                    "& .MuiInputBase-root": {
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
            <Stack spacing={"15px"} width={1} marginTop={"10px!important"}>
              <Stack direction={"row"} spacing={"5px"} alignItems={"center"}>
                <Typography fontSize={12}>Select Portable Wallet: </Typography>
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
                    <Stack>
                      <input
                        style={{
                          display: "block",
                          width: "200px",
                          color: error || errorPpk ? "red" : "black",
                        }}
                        type={"file"}
                        accept={"application/json"}
                        {...field}
                        //@ts-ignore
                        value={field?.value?.fileName}
                        onChange={(event) => {
                          field.onChange(event?.target?.files?.[0] || null);
                        }}
                      />
                    </Stack>
                  )}
                />
              </Stack>

              <TextField
                fullWidth
                label={"File Password (Optional)"}
                size={"small"}
                type={"password"}
                error={wrongFilePassword}
                helperText={wrongFilePassword ? "Invalid password" : undefined}
                {...register("file_password")}
              />
            </Stack>
          )}

          <Divider
            sx={{
              width: "calc(100% + 5px)",
              marginBottom: "5px!important",
            }}
            orientation={"horizontal"}
          />

          <FormProvider {...methods}>
            <Password
              passwordName={"password"}
              labelPassword={"Account Password"}
              confirmPasswordName={"confirm_password"}
              containerProps={{
                width: 1,
                marginTop: "5px!important",
                spacing: 0.5,
              }}
              inputsContainerProps={{
                spacing: "18px",
              }}
              randomKey={"import-acc"}
            />
            {!passwordRemembered && (
              <>
                <Divider
                  sx={{
                    width: "calc(100% + 5px)",
                    marginBottom: "5px!important",
                  }}
                  orientation={"horizontal"}
                />
                <Password
                  passwordName={"vault_password"}
                  canGenerateRandom={false}
                  justRequire={true}
                  canShowPassword={true}
                  labelPassword={"Vault Password"}
                  hidePasswordStrong={true}
                  errorPassword={wrongPassword ? "Wrong password" : undefined}
                  containerProps={{
                    marginTop: "10px!important",
                    spacing: 0.5,
                  }}
                />
              </>
            )}
          </FormProvider>
        </Stack>
        <Stack
          direction={"row"}
          spacing={"20px"}
          width={1}
          paddingTop={"20px"}
          height={50}
          boxSizing={"border-box"}
        >
          <Button
            onClick={onClickCancel}
            sx={{
              textTransform: "none",
              fontWeight: 600,
              color: "gray",
              borderColor: "gray",
              height: 30,
            }}
            variant={"outlined"}
            fullWidth
          >
            Cancel
          </Button>
          <Button
            sx={{ textTransform: "none", fontWeight: 600, height: 30 }}
            variant={"contained"}
            fullWidth
            type={"submit"}
            disabled={isValidating}
          >
            Import
          </Button>
        </Stack>
      </Stack>
    );
  }, [
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
  ]);

  return (
    <Stack
      component={"form"}
      onSubmit={handleSubmit(onClickCreate)}
      alignItems={"center"}
      justifyContent={"center"}
      height={1}
      paddingX={0.5}
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
