import React from "react";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import AvatarByString from "./AvatarByString";
import { getTruncatedText } from "../../utils/ui";
import QuestionIcon from "../assets/img/question_icon.svg";
import ContactIcon from "../assets/img/contact_small_icon.svg";

interface AccountInfoProps {
  name?: string;
  address: string;
  type?: "account" | "contact";
}

export function AccountAvatar({
  name,
  type = "account",
  address,
}: AccountInfoProps) {
  return name ? (
    type === "account" ? (
      <AvatarByString string={address} />
    ) : (
      <ContactIcon className={"avatar"} />
    )
  ) : (
    <QuestionIcon />
  );
}

export default function AccountInfo(props: AccountInfoProps) {
  const { name, address } = props;
  return (
    <Stack direction={"row"} alignItems={"center"} spacing={name ? 0.8 : 0.7}>
      <AccountAvatar {...props} />
      <Typography variant={"subtitle2"}>
        {name || getTruncatedText(address, 5)}
      </Typography>
    </Stack>
  );
}
