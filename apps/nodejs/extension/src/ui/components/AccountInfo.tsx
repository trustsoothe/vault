import React from "react";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { SupportedProtocols } from "@soothe/vault";
import AvatarByString from "./AvatarByString";
import { useAppSelector } from "../hooks/redux";
import { getTruncatedText } from "../../utils/ui";
import QuestionIcon from "../assets/img/question_icon.svg";
import ContactIcon from "../assets/img/contact_small_icon.svg";
import { accountsSelector } from "../../redux/selectors/account";
import { contactsSelector } from "../../redux/selectors/contact";

interface AccountInfoProps {
  name?: string;
  address: string;
  type?: "account" | "contact" | "seed";
}

export function AccountAvatar({
  name,
  type = "account",
  address,
}: AccountInfoProps) {
  return name ? (
    type === "account" || type === "seed" ? (
      <AvatarByString
        string={address}
        type={type === "seed" ? "square" : "circle"}
      />
    ) : (
      <ContactIcon className={"avatar"} />
    )
  ) : (
    <QuestionIcon className={"avatar"} />
  );
}

export default function AccountInfo(props: AccountInfoProps) {
  const { name, address } = props;
  return (
    <Stack direction={"row"} alignItems={"center"} spacing={name ? 0.6 : 0.7}>
      <AccountAvatar {...props} />
      <Typography variant={"subtitle2"} noWrap>
        {name || getTruncatedText(address, 5)}
      </Typography>
    </Stack>
  );
}

interface AccountInfoFromAddressProps {
  address: string;
  protocol?: SupportedProtocols;
}

export function AccountInfoFromAddress(props: AccountInfoFromAddressProps) {
  const { address, protocol } = props;

  const contacts = useAppSelector(contactsSelector);
  const accounts = useAppSelector(accountsSelector);

  const contact = contacts.find(
    (contact) => contact.address === address && contact.protocol === protocol
  );
  const account = accounts.find(
    (account) => account.address === address && account.protocol === protocol
  );

  const componentProps: AccountInfoProps = {
    name: contact?.name || account?.name,
    address,
    type: contact ? "contact" : "account",
  };

  return <AccountInfo {...componentProps} />;
}
