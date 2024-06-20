import type { TextFieldProps } from "@mui/material";
import React, { useCallback, useState } from "react";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";

interface PasswordInputProps
  extends Omit<TextFieldProps<"outlined">, "variant"> {
  canShowPassword?: boolean;
}

function PasswordInput(
  { canShowPassword = true, ...props }: PasswordInputProps,
  ref: React.ForwardedRef<HTMLInputElement>
) {
  const [showText, setShowText] = useState(false);

  const toggleShowText = useCallback(() => {
    setShowText((prevState) => !prevState);
  }, []);

  return (
    <TextField
      inputRef={ref}
      type={showText && canShowPassword ? "text" : "password"}
      {...props}
      InputProps={{
        endAdornment: canShowPassword ? (
          <Button
            variant={"text"}
            onClick={toggleShowText}
            disabled={props.disabled}
            sx={{ marginRight: -0.8, minWidth: 0, paddingX: 1.2, height: 28 }}
          >
            {showText ? "Hide" : "Show"}
          </Button>
        ) : null,
        ...props?.InputProps,
      }}
    />
  );
}

export default React.forwardRef(PasswordInput);
