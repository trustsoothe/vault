import type { SerializedAsset } from "@poktscan/keyring";
import type { RootState } from "../../redux/store";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { useLocation, useNavigate } from "react-router-dom";
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

export const isHex = (str: string) => {
  return str.match(/^[0-9a-fA-F]+$/g);
};

export const byteLength = (str: string) => new Blob([str]).size;

//todo: validate private key?
const isPrivateKey = (str: string) => isHex(str) && byteLength(str) === 128;

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

type FormStatus = "normal" | "loading" | "error";

interface ImportAccountProps {
  assets: RootState["vault"]["entities"]["assets"]["list"];
  passwordRemembered: RootState["vault"]["passwordRemembered"];
}

const ImportAccount: React.FC<ImportAccountProps> = ({
  passwordRemembered,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [status, setStatus] = useState<FormStatus>("normal");
  const [wrongPassword, setWrongPassword] = useState(false);

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

  const [type, asset] = watch(["import_type", "asset"]);

  useEffect(() => {
    setValue("private_key", "");
    setValue("json_file", null);
    setValue("file_password", "");
    clearErrors(["private_key", "json_file"]);
  }, [type]);

  const onClickCancel = useCallback(() => {
    if (location.key !== "default") {
      navigate(-1);
    } else {
      navigate("/");
    }
  }, [navigate, location]);

  const onClickCreate = useCallback(
    async (data: FormValues) => {
      let text;

      if (data.json_file) {
        text = await data.json_file.text();
      }

      setStatus("loading");

      setTimeout(() => {
        enqueueSnackbar({
          style: { width: 200, minWidth: "200px!important" },
          message: `Account imported successfully.`,
          variant: "success",
          autoHideDuration: 2500,
        });
        // todo: navigate(`${ACCOUNTS_DETAIL_PAGE}?id=${result.data.accountId}`);
        navigate("/");
      }, 1000);
    },
    [navigate]
  );

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

    return (
      <Stack height={1} width={1} justifyContent={"space-between"}>
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
          <AutocompleteAsset
            control={control}
            autocompleteProps={{ openOnFocus: true }}
            textFieldProps={{ autoFocus: true }}
          />
          <TextField
            fullWidth
            label={"Account Name"}
            size={"small"}
            {...register("account_name", nameRules)}
            error={!!formState?.errors?.account_name}
            helperText={formState?.errors?.account_name?.message}
          />

          <Divider
            sx={{
              width: "calc(100% + 5px)",
              marginLeft: "-5px",
            }}
            orientation={"horizontal"}
          />

          <Stack
            direction={"row"}
            justifyContent={"space-between"}
            alignItems={"center"}
            width={1}
            height={30}
            marginTop={"15px!important"}
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
              disabled={!asset}
              {...register("private_key", {
                validate: (value, formValues) => {
                  if (!value && formValues.import_type === "private_key") {
                    return "Required";
                  }

                  if (
                    !isPrivateKey(value) &&
                    formValues.import_type === "private_key"
                  ) {
                    return "Invalid Private Key";
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
                    validate: (value, formValues) => {
                      if (!value && formValues.import_type === "json_file") {
                        return "Required";
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
                          color: error ? "red" : "black",
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
              hidePasswordStrong={true}
              containerProps={{
                width: 1,
                marginTop: "5px!important",
                spacing: "18px",
              }}
              inputsContainerProps={{
                spacing: "18px",
              }}
            />
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
              }}
            />
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
          >
            Import
          </Button>
        </Stack>
      </Stack>
    );
  }, [
    register,
    control,
    onClickCancel,
    type,
    status,
    getValues,
    formState,
    methods,
    passwordRemembered,
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
    assets: state.vault.entities.assets.list,
    passwordRemembered: state.vault.passwordRemembered,
  };
};

export default connect(mapStateToProps)(ImportAccount);
