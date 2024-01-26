import type { SerializedAccountReference } from "@poktscan/keyring";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import { useTheme } from "@mui/material";
import Stack from "@mui/material/Stack";
import Fade from "@mui/material/Fade";
import Button from "@mui/material/Button";
import { useNavigate } from "react-router-dom";
import { Controller, useForm } from "react-hook-form";
import { ClickAwayListener } from "@mui/base/ClickAwayListener";
import AppToBackground from "../../controllers/communication/AppToBackground";
import CircularLoading from "../common/CircularLoading";
import OperationFailed from "../common/OperationFailed";
import { enqueueSnackbar } from "../../utils/ui";
import { nameRules } from "./CreateModal";
import { EXPORT_VAULT_PAGE } from "../../constants/routes";

interface RenameModalProps {
  account?: SerializedAccountReference;
  onClose: () => void;
}

interface FormValues {
  account_name: string;
  vault_password?: string;
}

const RenameModal: React.FC<RenameModalProps> = ({ account, onClose }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [wrongPassword, setWrongPassword] = useState(false);
  const [status, setStatus] = useState<"normal" | "loading" | "error">(
    "normal"
  );
  const [stillShowModal, setStillShowModal] = useState(false);

  const methods = useForm<FormValues>({
    defaultValues: {
      account_name: "",
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
        account_name: account?.name || "",
        vault_password: "",
      });
    } else {
      setTimeout(() => {
        reset({
          account_name: account?.name || "",
          vault_password: "",
        });
        setStillShowModal(false);
      }, 225);
    }
  }, [account]);

  const onSubmit = useCallback(
    (data: FormValues) => {
      if (!account) return;

      setStatus("loading");
      AppToBackground.updateAccount({
        id: account.id,
        name: data.account_name,
      }).then((result) => {
        if (result.error) {
          setStatus("error");
          return;
        }

        if (result.data?.isPasswordWrong) {
          setWrongPassword(true);
        } else {
          enqueueSnackbar({
            message: (onClickClose) => (
              <Stack>
                <span>Account name updated successfully.</span>
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
          onClose();
        }
        setStatus("normal");
      });
    },
    [account, onClose, navigate]
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
        Rename Account
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
          <Stack spacing={1.5}>
            {title}
            <Controller
              name={"account_name"}
              control={control}
              rules={nameRules}
              render={({ field, fieldState: { error } }) => (
                <TextField
                  label={"Rename"}
                  autoFocus
                  required
                  size={"small"}
                  fullWidth
                  {...field}
                  InputLabelProps={{
                    shrink: !!field.value,
                  }}
                  error={!!error}
                  helperText={error?.message}
                />
              )}
            />
          </Stack>
          <Stack direction={"row"} spacing={2} width={1}>
            <Button
              onClick={onClose}
              sx={{
                fontWeight: 700,
                color: theme.customColors.dark50,
                borderColor: theme.customColors.dark50,
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
              Save
            </Button>
          </Stack>
        </>
      );
    }

    return (
      <ClickAwayListener onClickAway={onClickAway}>
        <Stack
          width={1}
          height={180}
          paddingX={2.5}
          paddingTop={1.5}
          paddingBottom={2}
          component={"form"}
          borderRadius={"8px"}
          boxSizing={"border-box"}
          justifyContent={"space-between"}
          bgcolor={theme.customColors.white}
          boxShadow={"2px 2px 14px 0px #1C2D4A33"}
          border={`1px solid ${theme.customColors.dark25}`}
          onSubmit={status === "loading" ? undefined : handleSubmit(onSubmit)}
        >
          {component}
        </Stack>
      </ClickAwayListener>
    );
  }, [
    status,
    account,
    handleSubmit,
    onSubmit,
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

export default RenameModal;
