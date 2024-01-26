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
import { getPrivateKey, ImportComponent } from "./Import";
import { accountsImportedSelector } from "../../redux/selectors/account";
import { getAddressFromPrivateKey } from "../../utils/networkOperations";
import { INVALID_FILE_PASSWORD } from "../../errors/account";

interface RenameModalProps {
  account?: SerializedAccountReference;
  onClose: () => void;
}

interface FormValues {
  vault_password?: string;
  import_type: "private_key" | "json_file";
  private_key?: string;
  json_file?: File | null;
  file_password?: string;
}

const defaultValues: FormValues = {
  vault_password: "",
  import_type: "private_key",
  private_key: "",
  json_file: null,
  file_password: "",
};

const RemoveModal: React.FC<RenameModalProps> = ({ account, onClose }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const requirePassword = useAppSelector(
    requirePasswordForSensitiveOptsSelector
  );
  const accountsImported = useAppSelector(accountsImportedSelector);
  const [wrongPassword, setWrongPassword] = useState(false);
  const [wrongFilePassword, setWrongFilePassword] = useState(false);
  const [status, setStatus] = useState<
    "normal" | "loading" | "error" | "invalid_pk"
  >("normal");
  const [stillShowModal, setStillShowModal] = useState(false);

  const methods = useForm<FormValues>({
    defaultValues,
  });

  const { handleSubmit, control, getValues, watch, reset } = methods;
  const [pass, file_password, importType] = watch([
    "vault_password",
    "file_password",
    "import_type",
  ]);
  const shouldCheckPk = !accountsImported.includes(account?.address);

  useEffect(() => {
    if (wrongPassword) {
      setWrongPassword(false);
    }
  }, [pass]);

  useEffect(() => {
    if (wrongFilePassword) {
      setWrongFilePassword(false);
    }
  }, [file_password]);

  useEffect(() => {
    if (account) {
      setTimeout(() => setStillShowModal(true), 100);

      reset({
        ...defaultValues,
      });
    } else {
      setTimeout(() => {
        reset({
          ...defaultValues,
        });
        setStillShowModal(false);
      }, 225);
    }
    setStatus("normal");
  }, [account]);

  const removeAccount = useCallback(
    async (data: FormValues) => {
      setStatus("loading");

      if (shouldCheckPk) {
        let privateKey: string;
        try {
          privateKey = await getPrivateKey(data, account.protocol);
        } catch (e) {
          if (e?.name === INVALID_FILE_PASSWORD.name) {
            setWrongFilePassword(true);
            setStatus("normal");
          } else {
            setStatus("error");
          }
          return;
        }

        const addressOfPk = await getAddressFromPrivateKey(
          privateKey,
          account.protocol
        );

        if (addressOfPk !== account.address) {
          setStatus("invalid_pk");
          return;
        }
      }

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
    [account, navigate, requirePassword, shouldCheckPk]
  );

  const onClickAway = useCallback(() => {
    if (account && stillShowModal) {
      if (status === "loading") return;

      onClose();
    }
  }, [status, onClose, account, stillShowModal]);

  const onClickOkOfInvalidPk = useCallback(() => {
    reset({
      ...defaultValues,
      import_type: getValues("import_type"),
    });
    setStatus("normal");
  }, [reset, getValues]);

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
            text={"There was an error removing the account."}
            onCancel={onClose}
            retryBtnProps={{ sx: { height: 30, fontSize: 14 } }}
            cancelBtnProps={{ sx: { height: 30, fontSize: 14 } }}
          />
        </Stack>
      );
    } else if (status === "invalid_pk") {
      component = (
        <Stack flexGrow={1}>
          {title}
          <OperationFailed
            text={`The ${
              importType === "private_key" ? "private key" : "portable wallet"
            } you passed do not correspond to the account you are trying to remove. Please pass the correct private key or portable wallet of this account.`}
            onCancel={onClose}
            textProps={{
              fontSize: 13,
            }}
            retryBtnText={"Ok"}
            onRetry={onClickOkOfInvalidPk}
            retryBtnProps={{ sx: { height: 30, fontSize: 14 }, type: "button" }}
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
              marginBottom={0.5}
              paddingX={0.5}
            >
              Are you sure you want to remove the following account?
            </Typography>
            {account && <AccountInfo account={account} compact={true} />}
            {shouldCheckPk && (
              <>
                <Typography fontSize={12} marginLeft={0.8} marginTop={0.5}>
                  To allow you to remove this account we have to make sure that
                  you have it private key or portable wallet somewhere saved.
                  Please import it:
                </Typography>
                <Stack
                  spacing={2}
                  height={1}
                  width={1}
                  marginTop={"-10px!important"}
                  sx={{ transform: "scale(0.95)" }}
                >
                  <FormProvider {...methods}>
                    <ImportComponent
                      wrongFilePassword={wrongFilePassword}
                      customMenuSxProps={{
                        "& .MuiPaper-root": {
                          top: "46px!important",
                          left: "178px!important",
                          height: 76,
                          maxHeight: "unset",
                        },
                      }}
                    />
                  </FormProvider>
                </Stack>
              </>
            )}
            {requirePassword && (
              <>
                <Divider
                  sx={{
                    borderColor: theme.customColors.dark15,
                    marginTop: `${shouldCheckPk ? 13 : 22}px!important`,
                    marginBottom: `${shouldCheckPk ? 5 : 15}px!important`,
                  }}
                />
                <Typography
                  fontSize={14}
                  width={1}
                  fontWeight={500}
                  lineHeight={"30px"}
                  sx={{ userSelect: "none" }}
                >
                  To continue, enter the vault password:
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
    onClickOkOfInvalidPk,
    importType,
    wrongFilePassword,
    shouldCheckPk,
    onClose,
    requirePassword,
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
