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
  paddingBottom?: number;
  paddingTop?: number;
}

export default function RequestInfo({
  title,
  description,
  origin,
  paddingBottom = 2.4,
  paddingTop = 2,
}: RequestInfoProps) {
  return (
    <Stack
      paddingTop={title || description ? paddingTop : 1.4}
      paddingX={title || description ? paddingBottom : 1.6}
      paddingBottom={title || description ? 2.4 : 1.4}
      bgcolor={themeColors.bgLightGray}
      borderBottom={`1px solid ${themeColors.borderLightGray}`}
    >
      {title && (
        <Typography variant={"subtitle2"} marginBottom={description ? 0 : 0.6}>
          {title}
        </Typography>
      )}
      {description && (
        <Typography
          fontSize={11}
          marginTop={0.3}
          marginBottom={1.2}
          lineHeight={"16px"}
        >
          {description}
        </Typography>
      )}
      <RequestOrigin origin={origin} />
    </Stack>
  );
}
