import { useTheme } from "@mui/material";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { ClickAwayListener } from "@mui/base/ClickAwayListener";
import { Controller, FormProvider, useForm } from "react-hook-form";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { readFile } from "../../utils/ui";
import Password from "../common/Password";
import SelectFile from "../common/SelectFile";
import CircularLoading from "../common/CircularLoading";
import OperationFailed from "../common/OperationFailed";
import { VaultBackupSchema } from "../../redux/slices/vault/backup";

interface ImportModalProps {
  open: boolean;
  onClose: () => void;
}

interface FormValues {
  password: string;
  file?: File | null;
}

const INVALID_FILE_MESSAGE = "Wrong file. Select another";

const ImportModal: React.FC<ImportModalProps> = ({ open, onClose }) => {
  const theme = useTheme();
  const methods = useForm<FormValues>({
    defaultValues: {
      password: "",
    },
  });
  const { handleSubmit, control, watch } = methods;
  const [status, setStatus] = useState<"normal" | "loading" | "error">(
    "normal"
  );
  const [wrongPassword, setWrongPassword] = useState(false);

  const password = watch("password");

  useEffect(() => {
    if (wrongPassword) {
      setWrongPassword(false);
    }
  }, [password]);

  const onSubmit = useCallback((data: FormValues) => {
    setStatus("loading");

    setStatus("normal");
  }, []);

  const content = useMemo(() => {
    const title = (
      <Typography
        fontSize={16}
        fontWeight={700}
        lineHeight={"30px"}
        textAlign={"center"}
        color={theme.customColors.primary999}
      >
        Import Vault
      </Typography>
    );

    let component: React.ReactNode;

    if (status === "loading") {
      component = (
        <Stack flexGrow={1}>
          {title}
          <CircularLoading containerProps={{ marginTop: -1 }} />
        </Stack>
      );
    } else if (status === "error") {
      component = (
        <Stack flexGrow={1}>
          {title}
          <OperationFailed
            text={"There was an error exporting the vault."}
            onCancel={onClose}
            textProps={{
              fontSize: 15,
              marginBottom: "5px!important",
            }}
            retryBtnProps={{ sx: { height: 30, fontSize: 14 } }}
            cancelBtnProps={{ sx: { height: 30, fontSize: 14 } }}
          />
        </Stack>
      );
    } else {
      component = (
        <>
          <Stack>
            {title}
            <Typography
              fontSize={12}
              lineHeight={"20px"}
              marginTop={0.5}
              paddingX={0.5}
            >
              Select the Vault file
            </Typography>
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
                    await VaultBackupSchema.parseAsync(JSON.stringify(content));

                    return true;
                  } catch (e) {
                    return INVALID_FILE_MESSAGE;
                  }
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
                    error?.message === INVALID_FILE_MESSAGE
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
            <FormProvider {...methods}>
              <Password
                containerProps={{
                  spacing: 0.5,
                  marginTop: 1,
                }}
                passwordName={"anotherPassword"}
                labelPassword={"Vault Password"}
              />
            </FormProvider>
          </Stack>
          <Stack direction={"row"} spacing={2} width={1}>
            <Button
              onClick={onClose}
              sx={{
                fontWeight: 700,
                color: theme.customColors.dark50,
                borderColor: theme.customColors.dark25,
                height: 30,
                borderWidth: 1.5,
                fontSize: 14,
              }}
              variant={"outlined"}
              fullWidth
            >
              Cancel
            </Button>
            <Button
              sx={{
                fontWeight: 700,
                height: 30,
                fontSize: 14,
              }}
              variant={"contained"}
              fullWidth
              type={"submit"}
            >
              Proceed
            </Button>
          </Stack>
        </>
      );
    }
    return (
      <ClickAwayListener onClickAway={onClose}>
        <Stack
          width={1}
          paddingX={2.5}
          paddingTop={1.5}
          paddingBottom={2}
          component={"form"}
          onSubmit={handleSubmit(onSubmit)}
          borderRadius={"8px"}
          boxSizing={"border-box"}
          justifyContent={"space-between"}
          bgcolor={theme.customColors.white}
          height={500}
          boxShadow={"2px 2px 14px 0px #1C2D4A33"}
          border={`1px solid ${theme.customColors.dark25}`}
        >
          {component}
        </Stack>
      </ClickAwayListener>
    );
  }, [onSubmit, theme, onClose, status, handleSubmit, methods]);

  return null;
};
