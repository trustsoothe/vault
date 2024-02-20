import React from "react";
import Stack from "@mui/material/Stack";
import { useTheme } from "@mui/material";
import Typography from "@mui/material/Typography";
import { WIDTH } from "../../constants/ui";
import useIsPopup from "../../hooks/useIsPopup";
import LogoIcon from "../../assets/img/logo.svg";
import TooltipOverflow from "../common/TooltipOverflow";

interface RequestHeaderProps {
  origin: string;
  title: string;
}

const RequestHeader: React.FC<RequestHeaderProps> = ({ origin, title }) => {
  const theme = useTheme();
  const isPopup = useIsPopup();

  return (
    <Stack
      height={76.5}
      minHeight={76.5}
      bgcolor={theme.customColors.primary999}
      maxWidth={WIDTH}
      paddingLeft={1}
    >
      <Stack
        direction={"row"}
        alignItems={"center"}
        width={1}
        maxWidth={WIDTH}
        boxSizing={"border-box"}
        sx={
          isPopup
            ? undefined
            : {
                borderTopLeftRadius: "6px",
                borderTopRightRadius: "6px",
              }
        }
      >
        <LogoIcon />
        <Stack
          direction={"row"}
          alignItems={"center"}
          justifyContent={"space-between"}
          marginLeft={1}
          flexGrow={1}
          height={34}
        >
          <Typography
            variant={"h6"}
            fontSize={16}
            fontWeight={700}
            color={"white"}
            marginRight={1}
          >
            {title}
          </Typography>
        </Stack>
      </Stack>
      <Stack
        direction={"row"}
        alignItems={"center"}
        paddingLeft={0.5}
        maxWidth={WIDTH}
      >
        <Typography
          width={45}
          color={theme.customColors.dark25}
          fontSize={13}
          fontWeight={700}
          lineHeight={"30px"}
        >
          From:
        </Typography>
        <Stack
          height={30}
          paddingX={1}
          borderRadius={"2px"}
          width={325}
          marginTop={-0.6}
          boxSizing={"border-box"}
          justifyContent={"center"}
          bgcolor={"rgba(136, 136, 136, 0.15)"}
          border={`1px solid ${theme.customColors.dark75}`}
        >
          <TooltipOverflow
            text={origin}
            enableTextCopy={false}
            containerProps={{
              height: 17,
              marginTop: -0.4,
            }}
            textProps={{
              height: 17,
              lineHeight: "17px",
            }}
            linkProps={{
              fontSize: 13,
              fontWeight: 500,
              letterSpacing: "0.5px",
              color: theme.customColors.white,
            }}
          />
        </Stack>
      </Stack>
    </Stack>
  );
};

export default RequestHeader;
