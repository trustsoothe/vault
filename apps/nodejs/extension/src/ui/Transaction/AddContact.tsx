import React from "react";
import Button from "@mui/material/Button";
import { useNavigate } from "react-router-dom";
import { useFormContext } from "react-hook-form";
import { useAppSelector } from "../hooks/redux";
import { getTruncatedText } from "../../utils/ui";
import { CONTACTS_PAGE } from "../../constants/routes";
import { TransactionFormValues } from "./BaseTransaction";
import { contactsSelector } from "../../redux/selectors/contact";
import { accountsSelector } from "../../redux/selectors/account";

interface AddContactProps {
  onCancel?: () => void;
}

export default function AddContactButton({ onCancel }: AddContactProps) {
  const navigate = useNavigate();
  const { watch } = useFormContext<TransactionFormValues>();
  const contacts = useAppSelector(contactsSelector);
  const accounts = useAppSelector(accountsSelector);

  const [recipientAddress, recipientProtocol, protocol] = watch([
    "recipientAddress",
    "recipientProtocol",
    "protocol",
  ]);

  const protocolOfRecipient = recipientProtocol || protocol;

  const account = accounts.find(
    (account) =>
      account.address.toLowerCase() === recipientAddress.toLowerCase() &&
      account.protocol === protocolOfRecipient
  );

  if (account) return null;

  const contact = contacts.find(
    (contact) =>
      contact.address.toLowerCase() === recipientAddress.toLowerCase() &&
      contact.protocol === protocolOfRecipient
  );

  if (contact) return null;

  const onClickAddContact = () => {
    const navigateToContacts = () => {
      navigate(
        `${CONTACTS_PAGE}?address=${recipientAddress}&protocol=${protocolOfRecipient}`
      );
    };

    if (onCancel) {
      onCancel();
      setTimeout(navigateToContacts, 150);
    } else {
      navigateToContacts();
    }
  };

  return (
    <Button
      fullWidth
      sx={{
        marginTop: 1.6,
      }}
      variant={"outlined"}
      onClick={onClickAddContact}
    >
      Add {getTruncatedText(recipientAddress, 4)} to Contacts
    </Button>
  );
}
