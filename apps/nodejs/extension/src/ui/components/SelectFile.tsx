import React from "react";
import { styled } from "@mui/material";
import Stack from "@mui/material/Stack";
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

export default function SelectFile({
  filename,
  filenameProps,
  buttonProps,
  selectFileLabel = "Select File",
  inputFields,
}: SelectFileProps) {
  return (
    <Stack
      height={37}
      width={1}
      direction={"row"}
      spacing={"5px"}
      alignItems={"center"}
      paddingLeft={1.5}
      paddingRight={1}
      justifyContent={"space-between"}
      sx={{
        borderRadius: "6px",
        boxSizing: "border-box",
        backgroundColor: "#fff",
        border: "solid 1px #d5d8dc",
        boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.08)",
      }}
    >
      <Typography
        fontSize={13}
        noWrap={true}
        color={"#8b93a0"}
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
          justifyContent: "flex-end",
          paddingX: 0.5,
          fontSize: 13,
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
}
