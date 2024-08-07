import type { SerializedAccountReference } from "@poktscan/vault";
import React from "react";
import TextField from "@mui/material/TextField";
import { useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { closeSnackbar, SnackbarKey } from "notistack";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import DialogButtons from "../components/DialogButtons";
import AppToBackground from "../../controllers/communication/AppToBackground";
import { nameRules } from "../NewAccount/NewAccountModal";
import AccountFeedback from "../components/AccountFeedback";
import { enqueueErrorSnackbar } from "../../utils/ui";
import BaseDialog from "../components/BaseDialog";

interface RenameAccountModalProps {
  account?: SerializedAccountReference;
  onClose: () => void;
}

export default function RenameAccountModal({
  account,
  onClose,
}: RenameAccountModalProps) {
  const errorSnackbarKey = useRef<SnackbarKey>();
  const [status, setStatus] = useState<"form" | "loading" | "success">("form");
  const lastUpdatedAccountRef = useRef<SerializedAccountReference>(null);
  const { reset, control, handleSubmit, watch } = useForm({
    defaultValues: {
      name: "",
    },
  });
  const name = watch("name");

  const closeSnackbars = () => {
    if (errorSnackbarKey.current) {
      closeSnackbar(errorSnackbarKey.current);
      errorSnackbarKey.current = null;
    }
  };

  useEffect(() => {
    let timeout: NodeJS.Timeout;

    if (account) {
      reset({ name: "" });
    } else {
      timeout = setTimeout(() => {
        reset({ name: "" });
        setStatus("form");
        lastUpdatedAccountRef.current = undefined;
      }, 150);
    }

    closeSnackbars();

    return () => {
      closeSnackbars();
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [account]);

  const onSubmit = (data) => {
    if (!account) return;

    setStatus("loading");
    AppToBackground.updateAccount({
      id: account.id,
      name: data.name,
    }).then((result) => {
      if (result.error) {
        errorSnackbarKey.current = enqueueErrorSnackbar({
          message: "Rename Account Failed",
          onRetry: () => onSubmit(data),
        });
        return;
      }
      closeSnackbars();
      lastUpdatedAccountRef.current = account;

      setStatus("success");
    });
  };

  const isLoading = status === "loading";
  let content: React.ReactNode;

  switch (status) {
    case "loading":
    case "form":
      content = (
        <>
          <DialogContent sx={{ padding: "24px!important" }}>
            <Controller
              name={"name"}
              control={control}
              rules={nameRules}
              render={({ field, fieldState: { error } }) => (
                <TextField
                  required
                  autoFocus
                  disabled={isLoading}
                  autoComplete={"off"}
                  placeholder={account?.name}
                  {...field}
                  error={!!error}
                  helperText={error?.message}
                />
              )}
            />
          </DialogContent>
          <DialogActions sx={{ padding: 0, height: 85 }}>
            <DialogButtons
              primaryButtonProps={{
                children: "Rename",
                type: "submit",
                disabled: !name || account?.name === name,
                isLoading,
              }}
              secondaryButtonProps={{
                children: "Cancel",
                onClick: onClose,
                disabled: isLoading,
              }}
            />
          </DialogActions>
        </>
      );
      break;
    case "success":
      content = (
        <>
          <DialogContent sx={{ padding: "0px!important" }}>
            <AccountFeedback
              account={{
                ...(account || lastUpdatedAccountRef.current),
                name: name,
              }}
              label={"Account Renamed"}
            />
          </DialogContent>
          <DialogActions sx={{ padding: 0, height: 85 }}>
            <DialogButtons
              primaryButtonProps={{
                children: "Done",
                onClick: onClose,
              }}
            />
          </DialogActions>
        </>
      );
      break;
  }

  return (
    <BaseDialog
      open={!!account}
      onClose={onClose}
      isLoading={isLoading}
      title={"Rename Account"}
      PaperProps={{
        component: "form",
        onSubmit: handleSubmit(onSubmit),
      }}
    >
      {content}
    </BaseDialog>
  );
}
