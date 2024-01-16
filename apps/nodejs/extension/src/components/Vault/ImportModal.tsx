import { useTheme } from "@mui/material";
import Stack from "@mui/material/Stack";
import Fade from "@mui/material/Fade";
import { ZodError, ZodIssue } from "zod";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { ClickAwayListener } from "@mui/base/ClickAwayListener";
import { Controller, FormProvider, useForm } from "react-hook-form";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import Password from "../common/Password";
import SelectFile from "../common/SelectFile";
import CircularLoading from "../common/CircularLoading";
import OperationFailed from "../common/OperationFailed";
import { enqueueSnackbar, readFile } from "../../utils/ui";
import { VaultBackupSchema } from "../../redux/slices/vault/backup";
import AppToBackground from "../../controllers/communication/AppToBackground";

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
  const [fileErrors, setFileErrors] = useState<ZodIssue[]>([]);
  const [password, file] = watch(["password", "file"]);

  useEffect(() => {
    if (wrongPassword) {
      setWrongPassword(false);
    }
  }, [password]);

  useEffect(() => {
    if (fileErrors.length) {
      setFileErrors([]);
    }
  }, [file]);

  const onSubmit = useCallback(async (data: FormValues) => {
    try {
      setStatus("loading");

      const vaultContent = await readFile(data.file);
      const vault = VaultBackupSchema.parse(JSON.parse(vaultContent));

      AppToBackground.importVault({
        vault,
        password: data.password,
      }).then((res) => {
        if (res.error) {
          setStatus("error");
        } else {
          if (res?.data?.isPasswordWrong) {
            setWrongPassword(true);
          } else {
            enqueueSnackbar({
              variant: "success",
              message: "Vault was imported successfully!",
              persist: true,
            });
          }
          setStatus("normal");
        }
      });

      setStatus("normal");
    } catch (e) {
      setStatus("error");
    }
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
              fontSize={14}
              lineHeight={"20px"}
              marginTop={2}
              paddingX={0.5}
              fontWeight={500}
              marginLeft={0.2}
              marginBottom={0.5}
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
                      color: error
                        ? theme.customColors.red100
                        : theme.customColors.dark75,
                      sx: {
                        maxWidth: 215,
                      },
                    }}
                    filename={field.value?.name}
                    buttonProps={{
                      sx: {
                        color: error
                          ? theme.customColors.red100
                          : theme.customColors.primary500,
                      },
                    }}
                    inputFields={{
                      ...field,
                      // @ts-ignore
                      value: field?.value?.fileName,
                      onChange: (event) => {
                        field.onChange(event.target.files?.[0] || null);
                      },
                    }}
                  />
                  {error?.message && error.message !== INVALID_FILE_MESSAGE && (
                    <Typography
                      fontSize={10}
                      marginLeft={1}
                      color={theme.customColors.red100}
                    >
                      {error.message}
                    </Typography>
                  )}
                </Stack>
              )}
            />
            {fileErrors.length > 0 && (
              <Stack marginLeft={1}>
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
            <FormProvider {...methods}>
              <Password
                containerProps={{
                  spacing: 0.5,
                  marginTop: 1,
                }}
                passwordName={"password"}
                labelPassword={"Vault Password"}
                canGenerateRandom={false}
                hidePasswordStrong={true}
                justRequire={true}
                errorPassword={wrongPassword ? "Wrong password" : undefined}
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
          height={459}
          boxShadow={"2px 2px 14px 0px #1C2D4A33"}
          border={`1px solid ${theme.customColors.dark25}`}
        >
          {component}
        </Stack>
      </ClickAwayListener>
    );
  }, [
    onSubmit,
    theme,
    onClose,
    status,
    handleSubmit,
    methods,
    fileErrors,
    wrongPassword,
  ]);

  return (
    <Fade in={!!open}>
      <Stack
        width={1}
        height={489}
        padding={1.5}
        position={"absolute"}
        boxSizing={"border-box"}
        zIndex={Math.max(...Object.values(theme.zIndex)) + 1}
        top={111}
        left={0}
        bgcolor={"rgba(255,255,255,0.5)"}
      >
        {content}
      </Stack>
    </Fade>
  );
};

export default ImportModal;
