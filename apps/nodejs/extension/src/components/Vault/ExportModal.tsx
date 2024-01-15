import React, { useCallback, useMemo, useState } from "react";
import { saveAs } from "file-saver";
import Fade from "@mui/material/Fade";
import Stack from "@mui/material/Stack";
import { useTheme } from "@mui/material";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Typography from "@mui/material/Typography";
import { FormProvider, useForm } from "react-hook-form";
import FormControlLabel from "@mui/material/FormControlLabel";
import { ClickAwayListener } from "@mui/base/ClickAwayListener";
import AppToBackground from "../../controllers/communication/AppToBackground";
import CircularLoading from "../common/CircularLoading";
import OperationFailed from "../common/OperationFailed";
import { enqueueSnackbar } from "../../utils/ui";
import Password from "../common/Password";

interface ExportModalProps {
  open: boolean;
  onClose: () => void;
}

interface FormValues {
  anotherPassword: string;
  confirmPassword: string;
}

const ExportModal: React.FC<ExportModalProps> = ({ open, onClose }) => {
  const theme = useTheme();
  const methods = useForm<FormValues>({
    defaultValues: {
      anotherPassword: "",
      confirmPassword: "",
    },
  });
  const { handleSubmit } = methods;

  const [status, setStatus] = useState<"normal" | "loading" | "error">(
    "normal"
  );
  const [anotherPassword, setAnotherPassword] = useState(false);

  const onChangeAnotherPassword = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setAnotherPassword(event.target.checked);
    },
    []
  );

  const onSubmit = useCallback(
    (data: FormValues) => {
      setStatus("loading");

      const args = anotherPassword
        ? {
            encryptionPassword: data.anotherPassword,
          }
        : undefined;

      AppToBackground.exportVault(args).then(({ data, error }) => {
        if (error) {
          setStatus("error");
        } else {
          const blob = new Blob([JSON.stringify(data)], {
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
          onClose();
        }
      });
    },
    [onClose]
  );

  const content = useMemo(() => {
    const title = (
      <Typography
        fontSize={16}
        fontWeight={700}
        lineHeight={"30px"}
        textAlign={"center"}
        color={theme.customColors.primary999}
      >
        Export Vault
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
              Exporting your vault will allow you to have a backup and allow you
              to import it in another Pc or browser.
              <br />
              <br />
              We recommend you save your backup in another device or in a cloud
              storage service to prevent the case where you lose access to your
              vault because you cannot access anymore your PC.
              <br />
              <br />
              Note: your accounts will be exported encrypted.
            </Typography>
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
                label={"Encrypt vault with another password"}
              />
            </Stack>
            {anotherPassword && (
              <FormProvider {...methods}>
                <Password
                  containerProps={{
                    spacing: 0.5,
                    marginTop: 1,
                  }}
                  autofocusPassword={true}
                  passwordName={"anotherPassword"}
                  labelPassword={"Encryption Password"}
                  confirmPasswordName={"confirmPassword"}
                />
              </FormProvider>
            )}
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
          height={anotherPassword ? 500 : 330}
          boxShadow={"2px 2px 14px 0px #1C2D4A33"}
          border={`1px solid ${theme.customColors.dark25}`}
        >
          {component}
        </Stack>
      </ClickAwayListener>
    );
  }, [
    onChangeAnotherPassword,
    anotherPassword,
    onSubmit,
    theme,
    onClose,
    status,
    handleSubmit,
    methods,
  ]);

  return (
    <Fade in={!!open}>
      <Stack
        width={1}
        height={540}
        padding={1.5}
        position={"absolute"}
        boxSizing={"border-box"}
        zIndex={Math.max(...Object.values(theme.zIndex)) + 1}
        top={60}
        left={0}
        bgcolor={"rgba(255,255,255,0.5)"}
      >
        {content}
      </Stack>
    </Fade>
  );
};

export default ExportModal;
