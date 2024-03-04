import type { SupportedProtocols } from "@poktscan/keyring";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Controller,
  FormProvider,
  useForm,
  useFormContext,
} from "react-hook-form";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import Typography from "@mui/material/Typography";
import { SxProps, useTheme } from "@mui/material";
import browser from "webextension-polyfill";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Divider from "@mui/material/Divider";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import { nameRules } from "./CreateModal";
import CircularLoading from "../common/CircularLoading";
import OperationFailed from "../common/OperationFailed";
import AppToBackground from "../../controllers/communication/AppToBackground";
import {
  ACCOUNTS_PAGE,
  EXPORT_VAULT_PAGE,
  IMPORT_ACCOUNT_PAGE,
} from "../../constants/routes";
import {
  getAddressFromPrivateKey,
  getPrivateKeyFromPPK,
  isValidPPK,
  isValidPrivateKey,
} from "../../utils/networkOperations";
import { enqueueSnackbar, readFile } from "../../utils/ui";
import { useAppDispatch, useAppSelector } from "../../hooks/redux";
import {
  changeSelectedAccountOfNetwork,
  changeSelectedNetwork,
} from "../../redux/slices/app";
import {
  selectedChainByProtocolSelector,
  selectedProtocolSelector,
} from "../../redux/selectors/network";
import SelectFile from "../common/SelectFile";
import useIsPopup from "../../hooks/useIsPopup";
import ProtocolSelector from "../common/ProtocolSelector";
import { INVALID_FILE_PASSWORD } from "../../errors/account";

interface FormValues {
  import_type: "private_key" | "json_file";
  private_key?: string;
  json_file?: File | null;
  file_password?: string;
  account_name: string;
  protocol?: SupportedProtocols;
}

const INVALID_PPK_MESSAGE = "File is not valid";

export const getPrivateKey = async (
  data: Omit<FormValues, "account_name">,
  protocol: SupportedProtocols
) => {
  try {
    let privateKey: string;

    if (data.json_file) {
      const contentFile = await readFile(data.json_file);

      privateKey = await getPrivateKeyFromPPK(
        contentFile,
        data.file_password,
        protocol
      );
    } else {
      privateKey = data.private_key;
    }

    return privateKey;
  } catch (e) {
    if (
      [
        "Cannot define property stack, object is not extensible",
        "Unsupported state or unable to authenticate data",
        "Key derivation failed - possibly wrong password",
      ].includes(e?.message)
    ) {
      throw INVALID_FILE_PASSWORD;
    }

    throw e;
  }
};

type FormStatus = "normal" | "loading" | "error" | "account_exists";

interface ImportComponentProps {
  wrongFilePassword: boolean;
  customMenuSxProps?: SxProps;
}

export const ImportComponent: React.FC<ImportComponentProps> = ({
  wrongFilePassword,
  customMenuSxProps,
}) => {
  const theme = useTheme();
  const selectedProtocol = useAppSelector(selectedProtocolSelector);
  const { control, formState, register, watch } = useFormContext();
  const [type] = watch(["import_type"]);

  return (
    <>
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
              SelectProps={{
                MenuProps: {
                  sx: {
                    "& .MuiMenuItem-root": {
                      fontSize: 12,
                    },
                    ...customMenuSxProps,
                  },
                  disablePortal: true,
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
          required
          autoComplete={"off"}
          {...register("private_key", {
            validate: async (value, formValues) => {
              if (formValues.import_type === "private_key") {
                if (!value) {
                  return "Required";
                }

                if (
                  !isValidPrivateKey(
                    value,
                    formValues.protocol || selectedProtocol
                  )
                ) {
                  return "Invalid Private Key";
                }
              }

              return true;
            },
          })}
          error={!!formState?.errors?.private_key}
          helperText={formState?.errors?.private_key?.message as string}
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

                  const content = await readFile(value);

                  if (
                    !isValidPPK(
                      content,
                      formValues.protocol || selectedProtocol
                    )
                  ) {
                    return INVALID_PPK_MESSAGE;
                  }
                }

                return true;
              },
            }}
            render={({ field, fieldState: { error } }) => (
              <SelectFile
                filenameProps={{
                  color: error
                    ? theme.customColors.red100
                    : theme.customColors.dark75,
                }}
                filename={field.value?.name}
                buttonProps={{
                  sx: {
                    color: error
                      ? theme.customColors.red100
                      : theme.customColors.primary500,
                  },
                }}
                selectFileLabel={
                  error?.message === INVALID_PPK_MESSAGE
                    ? "Wrong File. Select Another"
                    : "Select File"
                }
                inputFields={{
                  ...field,
                  // @ts-ignore
                  value: field?.value?.fileName,
                  onChange: (event) => {
                    field.onChange(event.target.files?.[0] || null);
                  },
                }}
              />
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
    </>
  );
};

const ImportAccount: React.FC = () => {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const selectedProtocol = useAppSelector(selectedProtocolSelector);
  const selectedChainByProtocol = useAppSelector(
    selectedChainByProtocolSelector
  );

  const navigate = useNavigate();
  const location = useLocation();
  const isPopup = useIsPopup();
  const [searchParams] = useSearchParams();

  const [status, setStatus] = useState<FormStatus>("normal");
  const [passwordStep, setPasswordStep] = useState<"account" | "vault">(
    "account"
  );
  const [wrongFilePassword, setWrongFilePassword] = useState(false);

  const methods = useForm<FormValues>({
    defaultValues: {
      import_type: "private_key",
      private_key: "",
      json_file: null,
      file_password: "",
      account_name: "",
      protocol: selectedProtocol,
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
    reset,
  } = methods;

  const { isValidating } = formState;

  const [type, file_password] = watch(["import_type", "file_password"]);

  useEffect(() => {
    const wasOpenToImportFile = searchParams.get("openToImportFile") === "true";

    if (wasOpenToImportFile) {
      setValue("import_type", "json_file");
      if (location.key === "default") {
        enqueueSnackbar({
          variant: "info",
          message:
            "This page was open because you cannot import files in the popup.",
        });
      }
    }
  }, []);

  useEffect(() => {
    setValue("private_key", "");
    setValue("json_file", null);
    setValue("file_password", "");
    clearErrors(["private_key", "json_file"]);
    setValue("protocol", selectedProtocol);
    setWrongFilePassword(false);
  }, [type, selectedProtocol]);

  useEffect(() => {
    if (wrongFilePassword) {
      setWrongFilePassword(false);
    }
  }, [file_password]);

  useEffect(() => {
    if (isPopup && type === "json_file") {
      browser.tabs.create({
        active: true,
        url: `home.html#${IMPORT_ACCOUNT_PAGE}?openToImportFile=true`,
      });
    }
  }, [type]);

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

  const onSubmitImport = useCallback(
    async (data: FormValues) => {
      setStatus("loading");

      let privateKey: string;
      try {
        privateKey = await getPrivateKey(data, data.protocol);
      } catch (e) {
        if (e?.name === INVALID_FILE_PASSWORD.name) {
          setWrongFilePassword(true);
          setStatus("normal");
        } else {
          setStatus("error");
        }
        return;
      }

      AppToBackground.importAccount({
        protocol: data.protocol,
        name: data.account_name,
        privateKey,
      }).then(async (response) => {
        if (response.error) {
          setStatus("error");
        } else {
          if (response.data.accountAlreadyExists) {
            setStatus("account_exists");
          } else {
            const address = await getAddressFromPrivateKey(
              privateKey,
              data.protocol
            );
            Promise.all([
              ...(selectedProtocol !== data.protocol
                ? [
                    dispatch(
                      changeSelectedNetwork({
                        network: data.protocol,
                        chainId: selectedChainByProtocol[data.protocol],
                      })
                    ),
                  ]
                : []),
              dispatch(
                changeSelectedAccountOfNetwork({
                  protocol: data.protocol,
                  address: address,
                })
              ),
            ]).then(() => {
              setTimeout(() => {
                enqueueSnackbar({
                  message: (onClickClose) => (
                    <Stack>
                      <span>{`Account imported successfully.`}</span>
                      <span>
                        The vault content changed.{" "}
                        <Button
                          onClick={() => {
                            onClickClose();
                            navigate(EXPORT_VAULT_PAGE);
                          }}
                          sx={{ padding: 0, minWidth: 0 }}
                        >
                          Backup now?
                        </Button>
                      </span>
                    </Stack>
                  ),
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
      passwordStep,
      selectedProtocol,
      dispatch,
      selectedChainByProtocol,
    ]
  );

  const onClickOkAccountExists = useCallback(() => {
    setStatus("normal");
    reset({
      import_type: getValues("import_type"),
      account_name: "",
      json_file: null,
      private_key: "",
      file_password: "",
      protocol: selectedProtocol,
    });
  }, [reset, getValues, selectedProtocol]);

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
          text={
            "This account already exists and cannot be imported again. Import another one."
          }
          retryBtnProps={{
            type: "button",
          }}
          textProps={{
            width: 300,
            fontSize: 15,
          }}
          retryBtnText={"Ok"}
          onCancel={onClickCancel}
          onRetry={onClickOkAccountExists}
          buttonsContainerProps={{
            width: 275,
            marginTop: "20px!important",
            sx: {
              "& button": {
                width: 130,
                height: 30,
              },
            },
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
          <Controller
            control={control}
            name={"protocol"}
            render={({ field }) => {
              return (
                <ProtocolSelector
                  {...field}
                  fullWidth
                  sx={{
                    marginBottom: "5px!important",
                    "& .MuiFormHelperText-root": {
                      left: 4,
                      bottom: -18,
                      whiteSpace: "nowrap",
                    },
                  }}
                  helperText={`You'll be able to use this account for every network of the protocol selected`}
                  InputLabelProps={{ shrink: !!field.value }}
                />
              );
            }}
          />
          <TextField
            fullWidth
            required
            label={"Account Name"}
            autoComplete={"off"}
            size={"small"}
            autoFocus={true}
            {...register("account_name", nameRules)}
            error={!!formState?.errors?.account_name}
            helperText={formState?.errors?.account_name?.message}
          />
          <Divider />
          <FormProvider {...methods}>
            <ImportComponent wrongFilePassword={wrongFilePassword} />
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
            Cancel
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
            Import
          </Button>
        </Stack>
      </Stack>
    );
  }, [
    theme,
    wrongFilePassword,
    register,
    control,
    onClickCancel,
    type,
    status,
    getValues,
    formState,
    methods,
    navigate,
    isValidating,
    passwordStep,
    onClickOkAccountExists,
  ]);

  return (
    <Stack
      component={"form"}
      onSubmit={handleSubmit(onSubmitImport)}
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
