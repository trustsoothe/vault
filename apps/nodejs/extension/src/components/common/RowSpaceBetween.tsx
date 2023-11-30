import React from "react";
import Stack, { type StackProps } from "@mui/material/Stack";
import { useTheme } from "@mui/material";
import Typography, { type TypographyProps } from "@mui/material/Typography";
import TooltipOverflow from "./TooltipOverflow";

interface RowProps {
  label: string;
  value?: React.ReactNode;
  labelProps?: TypographyProps;
  containerProps?: StackProps;
}

const RowSpaceBetween: React.FC<RowProps> = ({
  label,
  containerProps,
  value,
  labelProps,
}) => {
  const theme = useTheme();
  return (
    <Stack
      width={1}
      height={20}
      direction={"row"}
      alignItems={"center"}
      justifyContent={"space-between"}
      {...containerProps}
    >
      <Typography
        fontSize={12}
        letterSpacing={"0.5px"}
        color={theme.customColors.dark50}
        {...labelProps}
      >
        {label}
      </Typography>
      {typeof value === "string" || !value ? (
        <TooltipOverflow
          text={value as string}
          linkProps={{
            fontSize: "11px!important",
            fontWeight: "400!important",
            flexGrow: 1,
            textAlign: "right",
            color: theme.customColors.dark100 + "!important",
          }}
        />
      ) : (
        value
      )}
    </Stack>
  );
};

export default RowSpaceBetween;
