import React from "react";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import UnsecureIcon from "../assets/img/unsecure_icon.svg";
import SecureIcon from "../assets/img/secure_icon.svg";
import { themeColors } from "../theme";

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
  const isOriginSecure = origin.startsWith("https");

  const [protocol, domain] = origin.split("://");

  return (
    <Stack
      paddingTop={2}
      paddingX={2.4}
      paddingBottom={2.4}
      bgcolor={themeColors.bgLightGray}
      borderBottom={`1px solid ${themeColors.borderLightGray}`}
    >
      <Typography variant={"subtitle2"}>{title}</Typography>
      <Typography fontSize={11} marginTop={0.3} lineHeight={"16px"}>
        {description}
      </Typography>
      <Stack
        height={31}
        paddingX={1.2}
        paddingY={0.86}
        marginTop={1.2}
        direction={"row"}
        borderRadius={"8px"}
        alignItems={"center"}
        boxSizing={"border-box"}
        bgcolor={themeColors.white}
        boxShadow={"0 1px 3px 0 rgba(0, 0, 0, 0.08)"}
      >
        {isOriginSecure ? <SecureIcon /> : <UnsecureIcon />}
        <Typography variant={"subtitle2"} marginLeft={0.8} fontWeight={400}>
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
    </Stack>
  );
}
