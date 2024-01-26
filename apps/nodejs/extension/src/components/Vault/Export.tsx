import { saveAs } from "file-saver";
import Stack from "@mui/material/Stack";
import { useTheme } from "@mui/material";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import { useNavigate } from "react-router-dom";
import Typography from "@mui/material/Typography";
import { FormProvider, useForm } from "react-hook-form";
import FormControlLabel from "@mui/material/FormControlLabel";
import React, { useCallback, useEffect, useState } from "react";
import Password from "../common/Password";
import { enqueueSnackbar } from "../../utils/ui";
import { ACCOUNTS_PAGE } from "../../constants/routes";
import CircularLoading from "../common/CircularLoading";
import OperationFailed from "../common/OperationFailed";
import AppToBackground from "../../controllers/communication/AppToBackground";

interface FormValues {
  vaultPassword: string;
  anotherPassword: string;
  confirmPassword: string;
}

const ExportVault: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  const methods = useForm<FormValues>({
    defaultValues: {
      vaultPassword: "",
      anotherPassword: "",
      confirmPassword: "",
    },
  });
  const { handleSubmit, watch } = methods;

  const [status, setStatus] = useState<"normal" | "loading" | "error">(
    "normal"
  );
  const [anotherPassword, setAnotherPassword] = useState(false);
  const [wrongPassword, setWrongPassword] = useState(false);

  const [vaultPassword] = watch(["vaultPassword"]);

  useEffect(() => {
    if (wrongPassword) {
      setWrongPassword(false);
    }
  }, [vaultPassword]);

  const onChangeAnotherPassword = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setAnotherPassword(event.target.checked);
    },
    []
  );

  const onSubmit = useCallback(
    (data: FormValues) => {
      setStatus("loading");

      AppToBackground.exportVault({
        currentVaultPassword: data.vaultPassword,
        encryptionPassword: anotherPassword ? data.anotherPassword : undefined,
      }).then(({ data, error }) => {
        if (error) {
          setStatus("error");
        } else if (data.isPasswordWrong) {
          setWrongPassword(true);
          setStatus("normal");
        } else {
          const blob = new Blob([JSON.stringify(data.vault)], {
            type: "application/json",
          });
          const filename = `soothe_vault_${new Date()
            .toISOString()
            .slice(0, 16)}.json`.replace(/:/g, "_");

          saveAs(blob, filename);
          enqueueSnackbar({
            variant: "success",
            message: (
              <span
                style={{ fontSize: 11 }}
              >{`Your vault has been exported successfully as ${filename} in your Downloads folder.`}</span>
            ),
          });
          navigate(ACCOUNTS_PAGE);
        }
      });
    },
    [navigate, anotherPassword]
  );

  let content: React.ReactNode;

  if (status === "loading") {
    content = <CircularLoading containerProps={{ marginTop: -1 }} />;
  } else if (status === "error") {
    content = (
      <OperationFailed
        text={"There was an error exporting the vault."}
        onCancel={() => navigate(ACCOUNTS_PAGE)}
        textProps={{
          fontSize: 15,
          marginBottom: "5px!important",
        }}
        retryBtnProps={{ sx: { height: 30, fontSize: 14 } }}
        cancelBtnProps={{ sx: { height: 30, fontSize: 14 } }}
      />
    );
  } else {
    content = (
      <>
        <Stack>
          <Typography fontSize={12} lineHeight={"20px"} marginTop={0.5}>
            Exporting your vault will allow you to have a backup and allow you
            to import it in another PC or browser.
            <br />
            <br />
            We recommend you to save your backup in another device or in a cloud
            storage service to prevent the case where you lose access to your
            vault because you cannot access your PC.
          </Typography>
          <FormProvider {...methods}>
            <Typography
              fontSize={12}
              fontWeight={500}
              marginTop={0.5}
              lineHeight={"24px"}
              letterSpacing={"0.5px"}
              sx={{ userSelect: "none" }}
              color={theme.customColors.dark100}
            >
              To continue, enter the vault password:
            </Typography>
            <Password
              containerProps={{
                spacing: 0.5,
                marginTop: 1,
              }}
              labelPassword={"Vault Password"}
              passwordName={"vaultPassword"}
              canGenerateRandom={false}
              autofocusPassword={true}
              hidePasswordStrong={true}
              justRequire={true}
              errorPassword={wrongPassword ? "Invalid password" : undefined}
            />
            <Stack alignSelf={"flex-start"} height={20} marginLeft={0.5}>
              <FormControlLabel
                sx={{
                  height: 20,
                  marginLeft: "-2px",
                  marginTop: 1,
                  userSelect: "none",
                  "& .MuiButtonBase-root": {
                    padding: 0,
                    transform: "scale(0.85)",
                  },
                  "& svg": {
                    fontSize: "18px!important",
                  },
                  "& .MuiTypography-root": {
                    marginLeft: 0.7,
                    fontSize: "10px!important",
                  },
                }}
                control={
                  <Checkbox
                    onChange={onChangeAnotherPassword}
                    checked={anotherPassword}
                  />
                }
                label={"Encrypt exported vault with another password"}
              />
            </Stack>
            {anotherPassword && (
              <Password
                containerProps={{
                  spacing: 0.5,
                  marginTop: 1,
                }}
                randomKey={"export_vault_random"}
                autofocusPassword={true}
                passwordName={"anotherPassword"}
                labelPassword={"Encryption Password"}
                confirmPasswordName={"confirmPassword"}
              />
            )}
          </FormProvider>
        </Stack>
        <Stack direction={"row"} spacing={2} width={1}>
          <Button
            onClick={() => navigate(ACCOUNTS_PAGE)}
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
    <Stack
      paddingTop={1}
      component={"form"}
      onSubmit={handleSubmit(onSubmit)}
      flexGrow={1}
      justifyContent={"space-between"}
    >
      {content}
    </Stack>
  );
};

export default ExportVault;
