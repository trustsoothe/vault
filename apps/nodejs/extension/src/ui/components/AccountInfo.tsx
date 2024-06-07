import React from "react";
import { darken } from "@mui/material";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { getTruncatedText } from "../../utils/ui";
import QuestionIcon from "../assets/img/question_icon.svg";

const stringToColour = (str: string) => {
  let hash = 0;
  str.split("").forEach((char) => {
    hash = char.charCodeAt(0) + ((hash << 5) - hash);
  });
  let colour = "#";
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xff;
    colour += value.toString(16).padStart(2, "0");
  }
  return colour;
};

interface AccountKnownAvatarProps {
  type: "known";
  address: string;
}

interface AccountUnknownAvatarProps {
  type: "unknown";
}

type AccountAvatarProps = AccountKnownAvatarProps | AccountUnknownAvatarProps;

export function AccountAvatar(props: AccountAvatarProps) {
  if (props.type === "unknown") {
    return <QuestionIcon />;
  }

  const color = stringToColour(props.address);
  const darkenColor = darken(color, 0.2);

  return (
    <Stack
      width={15}
      height={15}
      borderRadius={"50%"}
      sx={{ transform: "rotate(50deg)", overflow: "hidden" }}
    >
      <Stack height={1} bgcolor={color} />
      <Stack height={1} bgcolor={darkenColor} />
    </Stack>
  );
}

interface AccountInfoProps {
  name?: string;
  address: string;
}

export default function AccountInfo({ address, name }: AccountInfoProps) {
  return (
    <Stack direction={"row"} alignItems={"center"} spacing={name ? 0.8 : 0.7}>
      <AccountAvatar
        {...(name ? { address, type: "known" } : { type: "unknown" })}
      />
      <Typography variant={"subtitle2"}>
        {name || getTruncatedText(address, 5)}
      </Typography>
    </Stack>
  );
}
