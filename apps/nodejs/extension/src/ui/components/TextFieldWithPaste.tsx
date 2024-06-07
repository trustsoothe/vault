import type { TextFieldProps } from "@mui/material";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import React from "react";

interface TextFieldWithPasteProps
  extends Omit<TextFieldProps<"filled">, "onPaste" | "variant"> {
  onPaste: (value: string) => void;
}

export default function TextFieldWithPaste({
  onPaste,
  ...props
}: TextFieldWithPasteProps) {
  const pasteText = () => {
    navigator.clipboard.readText().then((pk) => {
      onPaste(pk);
    });
  };

  return (
    <TextField
      {...props}
      InputProps={{
        ...props?.InputProps,
        endAdornment: (
          <Button
            variant={"text"}
            onClick={pasteText}
            sx={{
              marginRight: -0.8,
              minWidth: 0,
              paddingX: 1.2,
              height: 28,
            }}
          >
            Paste
          </Button>
        ),
      }}
    />
  );
}
