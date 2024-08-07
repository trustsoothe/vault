import React from "react";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import UnsecureIcon from "../assets/img/unsecure_icon.svg";
import SecureIcon from "../assets/img/secure_icon.svg";
import { themeColors } from "../theme";

interface RequestOriginProps {
  origin: string;
}

export function RequestOrigin({ origin }: RequestOriginProps) {
  const isOriginSecure = origin.startsWith("https");
  const [protocol, domain] = origin.split("://");

  return (
    <Stack
      width={1}
      height={31}
      paddingX={1.2}
      paddingY={0.86}
      direction={"row"}
      borderRadius={"8px"}
      alignItems={"center"}
      boxSizing={"border-box"}
      bgcolor={themeColors.white}
      boxShadow={"0 1px 3px 0 rgba(0, 0, 0, 0.08)"}
      sx={{
        "& svg": {
          minWidth: 12,
        },
      }}
    >
      {isOriginSecure ? <SecureIcon /> : <UnsecureIcon />}
      <Typography
        variant={"subtitle2"}
        marginLeft={0.8}
        fontWeight={400}
        noWrap={true}
      >
        <span
          style={{
            color: isOriginSecure ? themeColors.success : themeColors.warning,
          }}
        >
          {protocol}://
        </span>
        {domain}
      </Typography>
    </Stack>
  );
}

interface RequestInfoProps {
  title: string;
  description: string;
  origin: string;
}

export default function RequestInfo({
  title,
  description,
  origin,
}: RequestInfoProps) {
  return (
    <Stack
      paddingTop={2}
      paddingX={2.4}
      paddingBottom={2.4}
      bgcolor={themeColors.bgLightGray}
      borderBottom={`1px solid ${themeColors.borderLightGray}`}
    >
      <Typography variant={"subtitle2"}>{title}</Typography>
      <Typography
        fontSize={11}
        marginTop={0.3}
        marginBottom={1.2}
        lineHeight={"16px"}
      >
        {description}
      </Typography>
      <RequestOrigin origin={origin} />
    </Stack>
  );
}
