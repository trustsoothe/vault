import React from "react";
import Stack from "@mui/material/Stack";
import { styled, useTheme } from "@mui/material";
import Button, { ButtonProps } from "@mui/material/Button";
import Typography, { TypographyProps } from "@mui/material/Typography";

interface SelectFileProps {
  filename?: string;
  filenameProps?: TypographyProps;
  buttonProps?: ButtonProps;
  selectFileLabel?: string;
  inputFields?: React.DetailedHTMLProps<
    React.InputHTMLAttributes<HTMLInputElement>,
    HTMLInputElement
  >;
}

const VisuallyHiddenInput = styled("input")({
  clip: "rect(0 0 0 0)",
  clipPath: "inset(50%)",
  height: 1,
  overflow: "hidden",
  position: "absolute",
  bottom: 0,
  left: 0,
  whiteSpace: "nowrap",
  width: 1,
});

const SelectFile: React.FC<SelectFileProps> = ({
  filename,
  filenameProps,
  buttonProps,
  selectFileLabel = "Select File",
  inputFields,
}) => {
  const theme = useTheme();
  return (
    <Stack
      direction={"row"}
      spacing={"5px"}
      alignItems={"center"}
      height={30}
      paddingX={1}
      bgcolor={theme.customColors.dark2}
      justifyContent={"space-between"}
    >
      <Typography
        fontSize={12}
        textOverflow={"ellipsis"}
        whiteSpace={"nowrap"}
        overflow={"hidden"}
        color={theme.customColors.dark75}
        {...filenameProps}
        sx={{
          maxWidth: 165,
          marginRight: 0.5,
          ...filenameProps?.sx,
        }}
      >
        {filename || "None File Selected"}
      </Typography>
      <Button
        variant={"text"}
        component={"label"}
        disableRipple={true}
        disableFocusRipple={true}
        {...buttonProps}
        sx={{
          height: 30,
          textDecoration: "underline",
          justifyContent: "flex-end",
          paddingX: 0,
          fontSize: 13,
          color: theme.customColors.primary500,
          "&:hover": {
            textDecoration: "underline",
            backgroundColor: theme.customColors.dark2,
          },
          ...buttonProps?.sx,
        }}
      >
        {selectFileLabel}
        <VisuallyHiddenInput
          type={"file"}
          accept={"application/json"}
          {...inputFields}
        />
      </Button>
    </Stack>
  );
};

export default SelectFile;
