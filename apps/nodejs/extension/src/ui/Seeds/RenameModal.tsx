import type { SerializedRecoveryPhraseReference } from "@soothe/vault";
import TextField from "@mui/material/TextField";
import { closeSnackbar, SnackbarKey } from "notistack";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import React, { useEffect, useRef, useState } from "react";
import { Controller, FormProvider, useForm } from "react-hook-form";
import AppToBackground from "../../controllers/communication/AppToBackground";
import { nameRules } from "../NewAccount/NewAccountModal";
import DialogButtons from "../components/DialogButtons";
import { enqueueErrorSnackbar } from "../../utils/ui";
import BaseDialog from "../components/BaseDialog";
import SeedAdded from "./SeedAdded";

interface RenameFormValues {
  name: string;
  phraseSize: string;
}

interface RenameModalProps {
  recoveryPhrase?: SerializedRecoveryPhraseReference;
  onClose: () => void;
}

export default function RenameSeedModal({
  recoveryPhrase,
  onClose,
}: RenameModalProps) {
  const errorSnackbarKey = useRef<SnackbarKey>();
  const lastUpdatedPhraseRef = useRef<SerializedRecoveryPhraseReference>(null);
  const methods = useForm<RenameFormValues>({
    defaultValues: {
      name: "",
      phraseSize: "",
    },
  });

  const { reset, control, handleSubmit, watch } = methods;

  const name = watch("name");
  const [status, setStatus] = useState<"form" | "loading" | "success">("form");

  const closeSnackbars = () => {
    if (errorSnackbarKey.current) {
      closeSnackbar(errorSnackbarKey.current);
      errorSnackbarKey.current = null;
    }
  };

  useEffect(() => {
    let timeout: NodeJS.Timeout;

    if (recoveryPhrase) {
      reset({ name: "", phraseSize: recoveryPhrase.length.toString() });
    } else {
      timeout = setTimeout(() => {
        reset({ name: "" });
        setStatus("form");
        lastUpdatedPhraseRef.current = undefined;
      }, 150);
    }

    return () => {
      closeSnackbars();
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [recoveryPhrase]);

  const onSubmit = (data: RenameFormValues) => {
    if (!recoveryPhrase) return;

    setStatus("loading");

    AppToBackground.updateRecoveryPhrase({
      recoveryPhraseId: recoveryPhrase.id,
      name: data.name,
    }).then((res) => {
      if (res.error) {
        errorSnackbarKey.current = enqueueErrorSnackbar({
          variant: "error",
          onRetry: () => onSubmit(data),
          message: {
            title: "Rename Seed Failed",
            content: "There was an error trying to rename your seed.",
          },
        });
        setStatus("form");
      } else {
        closeSnackbars();
        lastUpdatedPhraseRef.current = recoveryPhrase;
        setStatus("success");
      }
    });
  };

  const isLoading = status === "loading";
  let content: React.ReactNode;

  switch (status) {
    case "form":
    case "loading":
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
                  disabled={isLoading}
                  placeholder={recoveryPhrase?.name}
                  {...field}
                  error={!!error}
                  helperText={error?.message}
                />
              )}
            />
          </DialogContent>
          <DialogActions sx={{ padding: 0, height: 56 }}>
            <DialogButtons
              primaryButtonProps={{
                children: "Rename",
                type: "submit",
                isLoading,
                disabled: !name || recoveryPhrase?.name === name,
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
            <FormProvider {...methods}>
              <SeedAdded
                type={"renamed"}
                onDone={onClose}
                id={(recoveryPhrase || lastUpdatedPhraseRef.current)?.id}
              />
            </FormProvider>
          </DialogContent>
        </>
      );
      break;
  }

  return (
    <BaseDialog
      open={!!recoveryPhrase}
      onClose={onClose}
      title={"Rename Seed"}
      isLoading={isLoading}
      PaperProps={{
        component: "form",
        onSubmit: handleSubmit(onSubmit),
      }}
    >
      {content}
    </BaseDialog>
  );
}
