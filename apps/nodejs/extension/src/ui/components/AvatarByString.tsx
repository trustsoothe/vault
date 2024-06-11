import { darken, lighten } from "@mui/material";
import Stack from "@mui/material/Stack";
import React from "react";

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

const startsWithLetter = (str: string) => /^[A-Za-z]/.test(str);
const endsWithNumber = (str: string) => /[0-9]$/.test(str);
const alphabet = [
  "a",
  "b",
  "c",
  "d",
  "e",
  "f",
  "g",
  "h",
  "i",
  "j",
  "k",
  "l",
  "m",
  "n",
  "o",
  "p",
  "q",
  "r",
  "s",
  "t",
  "u",
  "v",
  "w",
  "x",
  "y",
  "z",
];

const getIsLowerThanMid = (str: string) => {
  let lowerThanMid: boolean;
  const lastChar = str.at(-1);

  if (isNaN(Number(lastChar))) {
    lowerThanMid = alphabet.indexOf(lastChar) < 14;
  } else {
    lowerThanMid = Number(lastChar) < 5;
  }

  return lowerThanMid;
};

interface AvatarProps {
  size: number;
  color: string;
  darkColor: string;
  type: "square" | "circle";
}

interface AvatarAProps extends AvatarProps {
  transform?: string;
}

function AvatarA({ size, darkColor, color, type, transform }: AvatarAProps) {
  return (
    <Stack
      width={size}
      height={size}
      borderRadius={type === "circle" ? "50%" : "4px"}
      sx={{
        transform: transform
          ? transform
          : type === "circle"
          ? "rotate(50deg)"
          : undefined,
        overflow: "hidden",
      }}
    >
      <Stack height={1} bgcolor={color} />
      <Stack height={1} bgcolor={darkColor} />
    </Stack>
  );
}

function AvatarB(props: AvatarProps) {
  return (
    <AvatarA
      {...props}
      transform={props.type === "square" ? "rotate(90deg)" : "rotate(310deg)"}
    />
  );
}

function AvatarC({
  size,
  darkColor,
  color,
  type,
  transform = "rotate(44deg)",
}: AvatarAProps) {
  return (
    <Stack
      width={size}
      height={size}
      display={"grid"}
      gridTemplateRows={"1fr 1fr"}
      gridTemplateColumns={"1fr 1fr"}
      sx={{ transform, overflow: "hidden" }}
      borderRadius={type === "circle" ? "50%" : "4px"}
    >
      <Stack height={1} bgcolor={color} />
      <Stack height={1} bgcolor={darkColor} />
      <Stack height={1} bgcolor={darkColor} />
      <Stack height={1} bgcolor={color} />
    </Stack>
  );
}

function AvatarD({
  size,
  darkColor,
  color,
  type,
  transform = "rotate(44deg)",
}: AvatarAProps) {
  return (
    <Stack
      width={size}
      height={size}
      bgcolor={darkColor}
      position={"relative"}
      sx={{
        transform: type === "circle" ? transform : undefined,
        overflow: "hidden",
        "& div": {
          width: size - 2,
          height: Math.ceil(size / 3) - 1,
          borderRadius: "3px",
          position: "absolute",
          backgroundColor: color,
          left: 1,
          transform: "rotate(-45deg)",
        },
      }}
      borderRadius={type === "circle" ? "50%" : "4px"}
    >
      <Stack sx={{ top: -1 }} />
      <Stack sx={{ bottom: -1 }} />
    </Stack>
  );
}

function AvatarE({ size, darkColor, color, type }: AvatarProps) {
  const childSize = Math.floor(size / 2);
  return (
    <Stack
      width={size}
      height={size}
      bgcolor={darkColor}
      alignItems={"center"}
      justifyContent={"center"}
      sx={{
        overflow: "hidden",
      }}
      borderRadius={type === "circle" ? "50%" : "4px"}
    >
      <Stack
        borderRadius={"50%"}
        bgcolor={color}
        width={childSize}
        height={childSize}
      />
    </Stack>
  );
}

function AvatarF({ size, darkColor, color, type, transform }: AvatarAProps) {
  return (
    <Stack
      width={size}
      height={size}
      borderRadius={type === "circle" ? "50%" : "4px"}
      sx={{
        transform: transform
          ? transform
          : type === "circle"
          ? "rotate(20deg)"
          : undefined,
        overflow: "hidden",
        "& div": {
          width: 1,
        },
      }}
    >
      <Stack height={0.2} bgcolor={darkColor} />
      <Stack height={0.18} bgcolor={color} />
      <Stack height={0.24} bgcolor={darkColor} />
      <Stack height={0.18} bgcolor={color} />
      <Stack height={0.2} bgcolor={darkColor} />
    </Stack>
  );
}

interface AvatarByStringProps {
  string: string;
  size?: number;
  type?: "square" | "circle";
}

export default function AvatarByString({
  string,
  size = 15,
  type = "circle",
}: AvatarByStringProps) {
  const baseColor = stringToColour(string);
  const color = lighten(baseColor, 0.1);
  const darkColor = darken(baseColor, 0.2);

  if (string.startsWith("0x")) {
    string = string.slice(2);
  }

  const avatarProps: AvatarProps = {
    size,
    color,
    darkColor,
    type,
  };

  let Avatar: typeof AvatarA;

  const lowerThanMid = getIsLowerThanMid(string);

  if (startsWithLetter(string)) {
    if (endsWithNumber(string)) {
      if (lowerThanMid) {
        Avatar = AvatarA;
      } else {
        Avatar = AvatarD;
      }
    } else {
      if (lowerThanMid) {
        Avatar = AvatarF;
      } else {
        Avatar = AvatarE;
      }
    }
  } else {
    if (endsWithNumber(string)) {
      if (lowerThanMid) {
        Avatar = AvatarB;
      } else {
        Avatar = AvatarD;
      }
    } else {
      if (lowerThanMid) {
        Avatar = AvatarA;
      } else {
        Avatar = AvatarC;
      }
    }
  }

  return <Avatar {...avatarProps} />;
}
