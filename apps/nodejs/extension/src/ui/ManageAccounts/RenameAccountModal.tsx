import type { SerializedAccountReference } from "@poktscan/vault";
import React from "react";
import TextField from "@mui/material/TextField";
import { useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import DialogButtons from "../components/DialogButtons";
import AppToBackground from "../../controllers/communication/AppToBackground";
import { nameRules } from "../NewAccount/NewAccountModal";
import AccountAdded from "../components/AccountAdded";
import BaseDialog from "../components/BaseDialog";

interface RenameAccountModalProps {
  account?: SerializedAccountReference;
  onClose: () => void;
}

export default function RenameAccountModal({
  account,
  onClose,
}: RenameAccountModalProps) {
  const [status, setStatus] = useState<
    "form" | "loading" | "error" | "success"
  >("form");
  const lastUpdatedAccountRef = useRef<SerializedAccountReference>(null);
  const { reset, control, handleSubmit, watch } = useForm({
    defaultValues: {
      name: "",
    },
  });
  const name = watch("name");

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

    return () => {
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
        setStatus("error");
        return;
      }
      lastUpdatedAccountRef.current = account;

      setStatus("success");
    });
  };

  let content: React.ReactNode;

  switch (status) {
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
              }}
              secondaryButtonProps={{ children: "Cancel", onClick: onClose }}
            />
          </DialogActions>
        </>
      );
      break;
    case "loading":
      break;
    case "error":
      break;
    case "success":
      content = (
        <>
          <DialogContent sx={{ padding: "0px!important" }}>
            <AccountAdded
              account={{
                ...(account || lastUpdatedAccountRef.current),
                name: name,
              }}
              successLabel={"Account Renamed"}
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
