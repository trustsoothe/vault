import PasteIcon from "@mui/icons-material/ContentPaste";
import type { TextFieldProps } from "@mui/material";
import IconButton from "@mui/material/IconButton";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import React from "react";

interface TextFieldWithPasteProps
  extends Omit<TextFieldProps<"filled">, "onPaste" | "variant"> {
  onPaste: (value: string) => void;
  overrideEndAdornment?: boolean;
  smallButton?: boolean;
}

function TextFieldWithPaste(
  {
    onPaste,
    overrideEndAdornment,
    smallButton = false,
    ...props
  }: TextFieldWithPasteProps,
  ref: React.ForwardedRef<HTMLInputElement>
) {
  const pasteText = () => {
    navigator.clipboard.readText().then((pk) => {
      onPaste(pk);
    });
  };

  return (
    <TextField
      {...props}
      inputRef={ref}
      InputProps={{
        ...props?.InputProps,
        endAdornment:
          overrideEndAdornment && props?.InputProps?.endAdornment ? (
            props?.InputProps?.endAdornment
          ) : smallButton ? (
            <IconButton
              onClick={pasteText}
              sx={{
                marginRight: -1,
                minWidth: 0,
                height: 28,
                width: 28,
              }}
            >
              <PasteIcon color={"primary"} sx={{ fontSize: 18 }} />
            </IconButton>
          ) : (
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

export default React.forwardRef(TextFieldWithPaste);
