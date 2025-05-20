import TextField from "@mui/material/TextField";
import { Controller, useForm } from "react-hook-form";
import { closeSnackbar, SnackbarKey } from "notistack";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import React, { useEffect, useRef, useState } from "react";
import { Contact, saveContact } from "../../redux/slices/app/contact";
import { nameRules } from "../NewAccount/NewAccountModal";
import DialogButtons from "../components/DialogButtons";
import { enqueueErrorSnackbar } from "../../utils/ui";
import { useAppDispatch } from "../hooks/redux";
import BaseDialog from "../components/BaseDialog";
import ContactFeedback from "./ContactFeedback";

interface RenameFormValues {
  name: string;
}

interface RenameModalProps {
  contact?: Contact;
  onClose: () => void;
}

export default function RenameContactModal({
  contact,
  onClose,
}: RenameModalProps) {
  const errorSnackbarKey = useRef<SnackbarKey>();
  const dispatch = useAppDispatch();
  const lastUpdatedContactRef = useRef<Contact>(null);
  const { reset, control, handleSubmit, watch } = useForm<RenameFormValues>({
    defaultValues: {
      name: "",
    },
  });

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

    if (contact) {
      reset({ name: "" });
    } else {
      timeout = setTimeout(() => {
        reset({ name: "" });
        setStatus("form");
        lastUpdatedContactRef.current = undefined;
      }, 150);
    }

    closeSnackbars();

    return () => {
      closeSnackbars();
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [contact]);

  const onSubmit = (data) => {
    if (!contact) return;

    setStatus("loading");

    dispatch(
      saveContact({
        idToReplace: contact.id,
        contact: {
          name: data.name,
          address: contact.address,
          protocol: contact.protocol,
        },
      })
    )
      .unwrap()
      .then(() => {
        closeSnackbars();
        lastUpdatedContactRef.current = contact;
        setStatus("success");
      })
      .catch(() => {
        errorSnackbarKey.current = enqueueErrorSnackbar({
          message: "Rename Contact Failed",
          onRetry: () => onSubmit(data),
        });
      });
  };

  let content: React.ReactNode;

  const isLoading = status === "loading";

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
                  placeholder={contact?.name}
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
                disabled: !name || contact?.name === name,
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
            <ContactFeedback
              type={"renamed"}
              contact={{
                ...(contact || lastUpdatedContactRef.current),
                name: name,
              }}
            />
          </DialogContent>
          <DialogActions sx={{ padding: 0, height: 56 }}>
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
      open={!!contact}
      onClose={onClose}
      isLoading={isLoading}
      title={"Rename Contact"}
      PaperProps={{
        component: "form",
        onSubmit: handleSubmit(onSubmit),
      }}
    >
      {content}
    </BaseDialog>
  );
}
