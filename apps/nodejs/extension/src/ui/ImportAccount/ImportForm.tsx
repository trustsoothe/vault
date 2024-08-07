import React from "react";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { Controller, useFormContext } from "react-hook-form";
import { ImportAccountFormValues } from "./ImportAccountModal";
import { selectedProtocolSelector } from "../../redux/selectors/network";
import { isValidPPK, isValidPrivateKey } from "../../utils/networkOperations";
import PasswordInput from "../components/PasswordInput";
import SelectFile from "../components/SelectFile";
import { useAppSelector } from "../hooks/redux";
import { readFile } from "../../utils/ui";
import { themeColors } from "../theme";

const INVALID_PPK_MESSAGE = "File is not valid";

interface ImportFormProps {
  disableInputs?: boolean;
  wrongFilePassword: boolean;
  infoText: string;
}

export default function ImportForm({
  wrongFilePassword,
  disableInputs,
  infoText,
}: ImportFormProps) {
  const selectedProtocol = useAppSelector(selectedProtocolSelector);
  const { control, setValue, clearErrors, register, watch } =
    useFormContext<ImportAccountFormValues>();
  const [type] = watch(["import_type"]);

  const pastePrivateKey = () => {
    navigator.clipboard.readText().then((pk) => {
      setValue("private_key", pk);
      clearErrors("private_key");
    });
  };

  return (
    <>
      <Controller
        control={control}
        name={"import_type"}
        render={({ field }) => (
          <TextField
            select
            {...field}
            disabled={disableInputs}
            SelectProps={{
              MenuProps: {
                slotProps: {
                  paper: {
                    sx: {
                      backgroundColor: themeColors.white,
                      marginTop: 0.3,
                      "& .MuiMenuItem-root": {
                        display: "flex",
                        alignItems: "center",
                        columnGap: 0.8,
                        "& img": {
                          marginTop: 0.2,
                        },
                        "& svg": {
                          position: "absolute",
                          right: 15,
                        },
                        paddingRight: 3,
                        position: "relative",
                        color: themeColors.black,
                        backgroundColor: themeColors.white,
                        "&.Mui-selected": {
                          backgroundColor: themeColors.bgLightGray,
                        },
                      },
                    },
                  },
                },
              },
            }}
          >
            <MenuItem value={"private_key"}>Private Key</MenuItem>
            <MenuItem value={"json_file"}>Portable Wallet</MenuItem>
          </TextField>
        )}
      />
      <Typography
        marginTop={0.8}
        variant={"body2"}
        marginBottom={1.6}
        color={themeColors.textSecondary}
      >
        {infoText}
      </Typography>
      {type === "private_key" ? (
        <Controller
          control={control}
          name={"private_key"}
          rules={{
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
          }}
          render={({ field, fieldState: { error } }) => (
            <TextField
              required
              fullWidth
              disabled={disableInputs}
              autoComplete={"off"}
              type={"password"}
              placeholder={"Private Key"}
              {...field}
              error={!!error}
              helperText={error?.message}
              InputProps={{
                endAdornment: (
                  <Button
                    variant={"text"}
                    onClick={pastePrivateKey}
                    sx={{
                      marginRight: -0.8,
                      minWidth: 0,
                      paddingX: 1.2,
                      height: 28,
                    }}
                  >
                    Paste
                  </Button>
                ),
              }}
            />
          )}
        />
      ) : (
        <>
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
              <Stack>
                <SelectFile
                  filenameProps={{
                    ...(field.value && {
                      color: "black",
                    }),
                    ...(error && {
                      color: "red",
                    }),
                    sx: {
                      maxWidth: 190,
                    },
                  }}
                  filename={field.value?.name}
                  buttonProps={{
                    disabled: disableInputs,
                    sx: {
                      ...(!!error && {
                        color: "red",
                      }),
                    },
                  }}
                  selectFileLabel={
                    error?.message === INVALID_PPK_MESSAGE
                      ? "Wrong File. Select Another"
                      : "Select File"
                  }
                  inputFields={{
                    disabled: disableInputs,
                    ...field,
                    // @ts-ignore
                    value: field?.value?.fileName,
                    onChange: (event) => {
                      field.onChange(event.target.files?.[0] || null);
                    },
                  }}
                />
                {error?.message && (
                  <Typography
                    fontSize={10}
                    marginLeft={1.5}
                    marginTop={0.3}
                    color={"red"}
                  >
                    {error.message}
                  </Typography>
                )}
              </Stack>
            )}
          />
          <PasswordInput
            disabled={disableInputs}
            placeholder={"File's Password (Optional)"}
            canShowPassword={false}
            error={wrongFilePassword}
            helperText={wrongFilePassword ? "Invalid password" : undefined}
            sx={{
              marginTop: 2,
            }}
            {...register("file_password")}
          />
        </>
      )}
    </>
  );
}
