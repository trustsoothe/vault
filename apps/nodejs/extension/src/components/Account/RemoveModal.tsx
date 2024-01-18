import type { SerializedAccountReference } from "@poktscan/keyring";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material";
import Stack from "@mui/material/Stack";
import Fade from "@mui/material/Fade";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import { useNavigate } from "react-router-dom";
import { ClickAwayListener } from "@mui/base/ClickAwayListener";
import { FormProvider, useForm } from "react-hook-form";
import AppToBackground from "../../controllers/communication/AppToBackground";
import CircularLoading from "../common/CircularLoading";
import OperationFailed from "../common/OperationFailed";
import { enqueueSnackbar } from "../../utils/ui";
import Password from "../common/Password";
import AccountInfo from "./AccountInfo";
import { useAppSelector } from "../../hooks/redux";
import { EXPORT_VAULT_PAGE } from "../../constants/routes";
import { requirePasswordForSensitiveOptsSelector } from "../../redux/selectors/preferences";

interface RenameModalProps {
  account?: SerializedAccountReference;
  onClose: () => void;
}

interface FormValues {
  vault_password?: string;
}

const RemoveModal: React.FC<RenameModalProps> = ({ account, onClose }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const requirePassword = useAppSelector(
    requirePasswordForSensitiveOptsSelector
  );
  const [wrongPassword, setWrongPassword] = useState(false);
  const [status, setStatus] = useState<"normal" | "loading" | "error">(
    "normal"
  );
  const [stillShowModal, setStillShowModal] = useState(false);

  const methods = useForm<FormValues>({
    defaultValues: {
      vault_password: "",
    },
  });

  const { handleSubmit, control, watch, reset } = methods;
  const pass = watch("vault_password");

  useEffect(() => {
    if (wrongPassword) {
      setWrongPassword(false);
    }
  }, [pass]);

  useEffect(() => {
    if (account) {
      setTimeout(() => setStillShowModal(true), 100);

      reset({
        vault_password: "",
      });
    } else {
      setTimeout(() => {
        reset({
          vault_password: "",
        });
        setStillShowModal(false);
      }, 225);
    }
  }, [account]);

  const removeAccount = useCallback(
    (data: FormValues) => {
      setStatus("loading");
      AppToBackground.removeAccount({
        serializedAccount: account,
        vaultPassword: requirePassword ? data.vault_password : undefined,
      }).then((response) => {
        if (response.error) {
          setStatus("error");
        } else {
          if (response.data.isPasswordWrong) {
            setStatus("normal");
            setWrongPassword(true);
          } else {
            onClose();
            enqueueSnackbar({
              message: (onClickClose) => (
                <Stack>
                  <span>Account removed successfully.</span>
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
          }
        }
      });
    },
    [account, navigate, requirePassword]
  );

  const onClickAway = useCallback(() => {
    if (account && stillShowModal) {
      if (status === "loading") return;

      onClose();
    }
  }, [status, onClose, account, stillShowModal]);

  const content = useMemo(() => {
    const title = (
      <Typography
        fontSize={16}
        fontWeight={700}
        lineHeight={"30px"}
        textAlign={"center"}
        color={theme.customColors.primary999}
      >
        Remove Account
      </Typography>
    );

    let component;

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
            text={"There was an error renaming the account."}
            onCancel={onClose}
            retryBtnProps={{ sx: { height: 30, fontSize: 14 } }}
            cancelBtnProps={{ sx: { height: 30, fontSize: 14 } }}
          />
        </Stack>
      );
    } else if (account || stillShowModal) {
      component = (
        <>
          <Stack>
            {title}
            <Typography
              color={theme.customColors.red100}
              fontWeight={700}
              fontSize={14}
              lineHeight={"20px"}
              textAlign={"center"}
              marginTop={0.5}
              marginBottom={2}
              paddingX={0.5}
            >
              Are you sure you want to remove the following account?
            </Typography>
            {account && <AccountInfo account={account} compact={true} />}
            {requirePassword && (
              <>
                <Divider
                  sx={{
                    borderColor: theme.customColors.dark15,
                    marginTop: "22px!important",
                    marginBottom: "15px!important",
                  }}
                />
                <Typography
                  fontSize={14}
                  width={1}
                  fontWeight={500}
                  lineHeight={"30px"}
                  sx={{ userSelect: "none" }}
                >
                  To continue, introduce the vault's password:
                </Typography>
                <FormProvider {...methods}>
                  <Password
                    passwordName={"vault_password"}
                    labelPassword={"Vault Password"}
                    canGenerateRandom={false}
                    justRequire={true}
                    hidePasswordStrong={true}
                    containerProps={{
                      marginTop: "5px!important",
                      spacing: 0.5,
                    }}
                    errorPassword={wrongPassword ? "Wrong password" : undefined}
                  />
                </FormProvider>
              </>
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
              Remove
            </Button>
          </Stack>
        </>
      );
    }

    return (
      <ClickAwayListener onClickAway={onClickAway}>
        <Stack
          width={1}
          paddingX={2.5}
          paddingTop={1.5}
          paddingBottom={2}
          component={"form"}
          borderRadius={"8px"}
          boxSizing={"border-box"}
          justifyContent={"space-between"}
          bgcolor={theme.customColors.white}
          height={510}
          boxShadow={"2px 2px 14px 0px #1C2D4A33"}
          border={`1px solid ${theme.customColors.dark25}`}
          onSubmit={
            status === "loading" ? undefined : handleSubmit(removeAccount)
          }
        >
          {component}
        </Stack>
      </ClickAwayListener>
    );
  }, [
    status,
    account,
    handleSubmit,
    removeAccount,
    theme,
    wrongPassword,
    methods,
    control,
    stillShowModal,
    onClickAway,
  ]);

  return (
    <Fade in={!!account}>
      <Stack
        width={1}
        height={540}
        padding={1.5}
        position={"absolute"}
        boxSizing={"border-box"}
        zIndex={9}
        top={-60}
        left={0}
        bgcolor={"rgba(255,255,255,0.5)"}
      >
        {content}
      </Stack>
    </Fade>
  );
};

export default RemoveModal;
