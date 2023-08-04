import React, { useCallback, useEffect, useMemo, useState } from "react";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import { useLocation, useNavigate } from "react-router-dom";
import Divider from "@mui/material/Divider";
import { Controller, FormProvider, useForm } from "react-hook-form";
import CircularLoading from "../common/CircularLoading";
import { RootState } from "../../redux/store";
import { connect } from "react-redux";
import { SerializedAsset } from "@poktscan/keyring";
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
  account_password: string;
  asset?: SerializedAsset;
}

type FormStatus = "normal" | "loading" | "error" | "submitted";

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

  const methods = useForm<FormValues>({
    defaultValues: {
      import_type: "private_key",
      private_key: "",
      json_file: null,
      file_password: "",
      account_name: "",
      account_password: "",
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

  const type = watch("import_type");

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

  const onClickCreate = useCallback(async (data: FormValues) => {
    let text;

    if (data.json_file) {
      text = await data.json_file.text();
    }

    setStatus("loading");

    setTimeout(() => {
      setStatus("submitted");
    }, 1500);
  }, []);

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

    if (status === "submitted") {
      const accountName = getValues("account_name");

      return (
        <>
          <Typography textAlign={"center"}>
            The account "{accountName}" was imported successfully!
          </Typography>
          <Button sx={{ textTransform: "none" }} onClick={() => navigate("/")}>
            Accept
          </Button>
        </>
      );
    }

    return (
      <>
        <Typography textAlign={"center"} variant={"h6"}>
          Import Account
        </Typography>
        <Stack
          direction={"row"}
          justifyContent={"space-between"}
          alignItems={"center"}
          width={1}
          marginBottom={"15px"}
        >
          <Typography>Select Type</Typography>
          <Controller
            control={control}
            name={"import_type"}
            render={({ field }) => (
              <TextField
                select
                size={"small"}
                placeholder={"Type"}
                sx={{
                  "& .MuiInputBase-root": {
                    minHeight: 30,
                    maxHeight: 30,
                    height: 30,
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

        <Divider
          sx={{
            marginY: "15px",
            width: "calc(100% + 30px)",
            marginLeft: "-5px",
          }}
          orientation={"horizontal"}
        />

        {type === "private_key" ? (
          <TextField
            label={"Private Key"}
            size={"small"}
            fullWidth
            autoFocus
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
          />
        ) : (
          <Stack
            alignItems={"center"}
            justifyContent={"center"}
            spacing={"15px"}
            width={1}
          >
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
                      style={{ display: "block", width: "220px" }}
                      type={"file"}
                      accept={"application/json"}
                      {...field}
                      //@ts-ignore
                      value={field?.value?.fileName}
                      onChange={(event) => {
                        console.log("FILE:", event?.target?.files?.[0] || null);
                        field.onChange(event?.target?.files?.[0] || null);
                      }}
                    />
                    {error && (
                      <Typography
                        color={"red"}
                        fontSize={"10px"}
                        sx={{ alignSelf: "flex-start" }}
                      >
                        {error.message}
                      </Typography>
                    )}
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
            marginY: "15px",
            width: "calc(100% + 30px)",
            marginLeft: "-5px",
          }}
          orientation={"horizontal"}
        />

        <AutocompleteAsset control={control} />

        <TextField
          fullWidth
          label={"Account Name"}
          size={"small"}
          {...register("account_name", nameRules)}
          error={!!formState?.errors?.account_name}
          helperText={formState?.errors?.account_name?.message}
        />
        <FormProvider {...methods}>
          <Password
            passwordName={"account_password"}
            canGenerateRandom={false}
            canGenerateRandomFirst={true}
            canShowPassword={false}
            labelPassword={"Account Password"}
            labelConfirm={"Vault Password"}
            hidePasswordStrong={true}
            confirmPasswordName={
              passwordRemembered ? undefined : "vault_password"
            }
            passwordAndConfirmEquals={false}
            containerProps={{
              width: 1,
              marginTop: "0px!important",
              spacing: "15px",
            }}
          />
        </FormProvider>
        <Stack direction={"row"} spacing={"20px"} width={1} marginTop={"20px"}>
          <Button
            onClick={onClickCancel}
            sx={{
              textTransform: "none",
              fontWeight: 600,
              color: "gray",
              borderColor: "gray",
            }}
            variant={"outlined"}
            fullWidth
          >
            Cancel
          </Button>
          <Button
            sx={{ textTransform: "none", fontWeight: 600 }}
            variant={"contained"}
            fullWidth
            type={"submit"}
            // disabled={!isValid}
          >
            Import
          </Button>
        </Stack>
      </>
    );
  }, [
    register,
    control,
    onClickCancel,
    type,
    status,
    navigate,
    getValues,
    formState,
  ]);

  return (
    <Stack
      component={"form"}
      onSubmit={handleSubmit(onClickCreate)}
      alignItems={"center"}
      justifyContent={"center"}
      height={"calc(100% - 20px)"}
      paddingX={"20px"}
      width={1}
      boxSizing={"border-box"}
      spacing={"15px"}
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
