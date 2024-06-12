import type {
  SerializedAccountReference,
  SupportedProtocols,
} from "@poktscan/vault";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import React, { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import { selectedProtocolSelector } from "../../redux/selectors/network";
import { Contact, saveContact } from "../../redux/slices/app/contact";
import { useAppDispatch, useAppSelector } from "../../hooks/redux";
import TextFieldWithPaste from "../components/TextFieldWithPaste";
import { contactsSelector } from "../../redux/selectors/contact";
import { accountsSelector } from "../../redux/selectors/account";
import { isValidAddress } from "../../utils/networkOperations";
import ProtocolSelector from "../components/ProtocolSelector";
import useDidMountEffect from "../../hooks/useDidMountEffect";
import AccountFeedback from "../components/AccountFeedback";
import { nameRules } from "../NewAccount/NewAccountModal";
import DialogButtons from "../components/DialogButtons";
import BaseDialog from "../components/BaseDialog";
import ContactFeedback from "./ContactFeedback";
import { themeColors } from "../theme";
import {
  ACCOUNT_ALREADY_EXISTS,
  CONTACT_ALREADY_EXISTS,
} from "../../errors/contact";

interface CreateContactFormValues {
  name: string;
  address: string;
  protocol: SupportedProtocols;
}

type FormStatus =
  | "normal"
  | "loading"
  | "error"
  | "success"
  | "contact_already_exists"
  | "account_already_exists";

interface CreateModalProps {
  open: boolean;
  onClose: () => void;
}

export default function CreateModal({ open, onClose }: CreateModalProps) {
  const dispatch = useAppDispatch();
  const contacts = useAppSelector(contactsSelector);
  const accounts = useAppSelector(accountsSelector);
  const protocol = useAppSelector(selectedProtocolSelector);
  const [status, setStatus] = useState<FormStatus>("normal");
  const [contactSaved, setContactSaved] = useState<Contact>(null);
  const [accountAlreadyExists, setAccountAlreadyExists] =
    useState<SerializedAccountReference>(null);

  const { reset, control, watch, handleSubmit, setValue, clearErrors } =
    useForm<CreateContactFormValues>({
      defaultValues: {
        name: "",
        protocol,
        address: "",
      },
    });

  const [name, address] = watch(["name", "address"]);

  useDidMountEffect(() => {
    setValue("protocol", protocol);
  }, [protocol]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      reset({ name: "", protocol, address: "" });
      setStatus("normal");
    }, 150);

    return () => clearTimeout(timeout);
  }, [open]);

  const onSubmit = async (data: Contact) => {
    setStatus("loading");

    dispatch(
      saveContact({
        contact: {
          name: data.name,
          address: data.address,
          protocol: data.protocol,
        },
      })
    )
      .unwrap()
      .then(({ contactSaved }) => {
        setContactSaved(contactSaved);
        setStatus("success");
      })
      .catch((error) => {
        if (error.name === CONTACT_ALREADY_EXISTS.name) {
          const contact = contacts.find(
            (c) => c.protocol === data.protocol && c.address === data.address
          );

          if (!contact) {
            return setStatus("error");
          }

          setContactSaved(contact);
          setStatus("contact_already_exists");
        } else if (error.name === ACCOUNT_ALREADY_EXISTS.name) {
          const account = accounts.find(
            (a) => a.protocol === data.protocol && a.address === data.address
          );

          if (!account) {
            return setStatus("error");
          }

          setAccountAlreadyExists(account);
          setStatus("account_already_exists");
        } else {
          setStatus("error");
        }
      });
  };

  const onPasteAddress = (address: string) => {
    setValue("address", address);
    clearErrors("address");
  };

  let content: React.ReactNode;

  switch (status) {
    case "normal":
      content = (
        <>
          <DialogContent
            sx={{
              padding: "24px!important",
            }}
          >
            <Controller
              control={control}
              name={"protocol"}
              render={({ field }) => <ProtocolSelector {...field} />}
            />
            <Typography
              variant={"body2"}
              marginTop={0.8}
              marginBottom={2}
              color={themeColors.textSecondary}
            >
              Select the contact’s protocol. The contact will show up when
              applicable.
            </Typography>
            <Controller
              control={control}
              name={"name"}
              rules={nameRules}
              render={({ field, fieldState: { error } }) => (
                <TextField
                  autoFocus
                  autoComplete={"off"}
                  placeholder={"Contact Name"}
                  {...field}
                  error={!!error}
                  helperText={error?.message}
                />
              )}
            />
            <Controller
              control={control}
              name={"address"}
              rules={{
                required: "Required",
                validate: (value, formValues) => {
                  if (!isValidAddress(value, formValues.protocol)) {
                    return "Invalid address";
                  }
                  return true;
                },
              }}
              render={({ field, fieldState: { error } }) => (
                <TextFieldWithPaste
                  autoComplete={"off"}
                  placeholder={"Public Address"}
                  onPaste={onPasteAddress}
                  required
                  sx={{
                    marginTop: 2,
                  }}
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
                children: "Save",
                type: "submit",
                disabled: !name || !address,
              }}
              secondaryButtonProps={{ children: "Cancel", onClick: onClose }}
            />
          </DialogActions>
        </>
      );
      break;
    case "loading":
      content = "Loading...";
      break;
    case "error":
      content = "Error...";
      break;
    case "account_already_exists":
      content = (
        <>
          <DialogContent sx={{ padding: "0px!important" }}>
            <AccountFeedback
              label={
                <Typography variant={"body2"} lineHeight={"16px"}>
                  Account with this address and protocol already exists
                </Typography>
              }
              account={accountAlreadyExists}
              type={"warning"}
            />
          </DialogContent>
          <DialogActions sx={{ padding: 0 }}>
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
    case "contact_already_exists":
    case "success":
      content = (
        <>
          <DialogContent sx={{ padding: "0px!important" }}>
            <ContactFeedback
              type={status === "success" ? "created" : "already_exists"}
              contact={contactSaved}
            />
          </DialogContent>
          <DialogActions sx={{ padding: 0 }}>
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
      title={"New Contact"}
      open={open}
      onClose={onClose}
      PaperProps={{
        component: "form",
        onSubmit: handleSubmit(onSubmit),
      }}
    >
      {content}
    </BaseDialog>
  );
}
