import Stack from "@mui/material/Stack";
import { ZodError, ZodIssue } from "zod";
import Typography from "@mui/material/Typography";
import { Controller, useForm } from "react-hook-form";
import { closeSnackbar, SnackbarKey } from "notistack";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import React, { useEffect, useRef, useState } from "react";
import AppToBackground from "../../controllers/communication/AppToBackground";
import { VaultBackupSchema } from "../../redux/slices/vault/backup";
import {
  enqueueErrorSnackbar,
  enqueueSnackbar,
  readFile,
  wrongPasswordSnackbar,
} from "../../utils/ui";
import PasswordInput from "../components/PasswordInput";
import DialogButtons from "../components/DialogButtons";
import BaseDialog from "../components/BaseDialog";
import SelectFile from "../components/SelectFile";

const INVALID_FILE_MESSAGE = "Wrong file. Select another";

interface ImportVaultForm {
  password: string;
  file?: File | null;
}

interface ImportVaultModalProps {
  open: boolean;
  onClose: () => void;
}

export default function ImportVaultModal({
  open,
  onClose,
}: ImportVaultModalProps) {
  const wrongPasswordSnackbarKey = useRef<SnackbarKey>();
  const errorSnackbarKey = useRef<SnackbarKey>();
  const methods = useForm<ImportVaultForm>({
    mode: "onChange",
    defaultValues: {
      password: "",
    },
  });
  const { handleSubmit, control, setValue, setFocus, watch, reset } = methods;
  const [status, setStatus] = useState<"normal" | "loading">("normal");

  const [fileErrors, setFileErrors] = useState<ZodIssue[]>([]);
  const [password, file] = watch(["password", "file"]);

  const closeSnackbars = () => {
    if (wrongPasswordSnackbarKey.current) {
      closeSnackbar(wrongPasswordSnackbarKey.current);
      wrongPasswordSnackbarKey.current = null;
    }

    if (errorSnackbarKey.current) {
      closeSnackbar(errorSnackbarKey.current);
      errorSnackbarKey.current = null;
    }
  };

  useEffect(() => {
    setTimeout(() => {
      reset({
        file: null,
        password: "",
      });
      setStatus("normal");
    }, 150);
    closeSnackbars();

    return closeSnackbars;
  }, [open]);

  useEffect(() => {
    if (fileErrors.length) {
      setFileErrors([]);
    }
  }, [file]);

  const onSubmit = async (data: ImportVaultForm) => {
    setStatus("loading");

    const vaultContent = await readFile(data.file);
    const vault = VaultBackupSchema.parse(JSON.parse(vaultContent));

    AppToBackground.importVault({
      vault,
      password: data.password,
    }).then((res) => {
      if (res.error) {
        errorSnackbarKey.current = enqueueErrorSnackbar({
          message: "Import Vault Failed",
          onRetry: () => onSubmit(data),
        });
      } else {
        if (res?.data?.isPasswordWrong) {
          wrongPasswordSnackbarKey.current = wrongPasswordSnackbar();
          setValue("password", "");
          setTimeout(() => setFocus("password"), 0);
        } else {
          closeSnackbars();

          enqueueSnackbar({
            variant: "success",
            message: "Vault was imported successfully!",
          });
        }
      }
      setStatus("normal");
    });
  };

  const isLoading = status === "loading";

  return (
    <BaseDialog
      open={open}
      onClose={onClose}
      isLoading={isLoading}
      title={"Import Vault"}
      PaperProps={{
        component: "form",
        onSubmit: handleSubmit(onSubmit),
      }}
    >
      <DialogContent
        sx={{
          rowGap: 2,
          display: "flex",
          flexDirection: "column",
          padding: "24px!important",
        }}
      >
        <Controller
          name={"file"}
          control={control}
          rules={{
            validate: async (value) => {
              try {
                if (!value) {
                  return "Required";
                }

                const content = await readFile(value);
                VaultBackupSchema.parse(JSON.parse(content));

                return true;
              } catch (e) {
                if (e instanceof ZodError) {
                  setFileErrors(e.issues);
                }
                return INVALID_FILE_MESSAGE;
              }
            },
          }}
          render={({ field, fieldState: { error } }) => (
            <Stack>
              <SelectFile
                filenameProps={{
                  ...(file && {
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
                  disabled: isLoading,
                  sx: {
                    ...(!!error && {
                      color: "red",
                    }),
                  },
                }}
                inputFields={{
                  disabled: isLoading,
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
        {fileErrors.length > 0 && (
          <Stack marginLeft={1} marginTop={-1}>
            <Typography fontSize={12}>File errors</Typography>
            <Stack component={"ul"} sx={{ paddingLeft: 1, marginY: 0 }}>
              {fileErrors.map((error) => {
                const path = error.path
                  .map((path) => path.toString())
                  .join(".");
                return (
                  <Stack
                    component={"li"}
                    direction={"row"}
                    spacing={0.5}
                    key={path}
                  >
                    <Typography
                      fontSize={11}
                      fontWeight={500}
                      whiteSpace={"nowrap"}
                    >
                      - {path}:
                    </Typography>
                    <Typography fontSize={11}>
                      {error.message.toLowerCase()}
                    </Typography>
                  </Stack>
                );
              })}
            </Stack>
          </Stack>
        )}
        <Controller
          control={control}
          name={"password"}
          render={({ field, fieldState: { error } }) => (
            <PasswordInput
              placeholder={"Vault Password"}
              required
              {...field}
              error={!!error}
              disabled={isLoading}
              helperText={error?.message}
            />
          )}
        />
      </DialogContent>
      <DialogActions sx={{ padding: 0, height: 56 }}>
        <DialogButtons
          primaryButtonProps={{
            isLoading,
            children: "Import",
            disabled: !password || !file,
            type: "submit",
          }}
          secondaryButtonProps={{
            children: "Cancel",
            onClick: onClose,
            disabled: isLoading,
          }}
        />
      </DialogActions>
    </BaseDialog>
  );
}
