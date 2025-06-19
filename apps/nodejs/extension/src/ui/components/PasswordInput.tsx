import type { TextFieldProps } from "@mui/material";
import React, { useCallback, useState } from "react";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import useCapsLock from "../hooks/useCapsLock";

interface PasswordInputProps
  extends Omit<TextFieldProps<"outlined">, "variant"> {
  canShowPassword?: boolean;
}

function PasswordInput(
  { canShowPassword = true, ...props }: PasswordInputProps,
) {
  const [showText, setShowText] = useState(false);
  const isCapsLockOn = useCapsLock();

  const toggleShowText = useCallback(() => {
    setShowText((prevState) => !prevState);
  }, []);

  return (
    <Stack flexDirection={'column'} alignItems={'center'} width={'100%'}>
      <TextField
        type={showText && canShowPassword ? "text" : "password"}
        {...props}
        InputProps={{
          endAdornment: canShowPassword && (
            <Button
              variant={"text"}
              onClick={toggleShowText}
              disabled={props.disabled}
              sx={{ marginRight: -0.8, minWidth: 0, paddingX: 1.2, height: 28 }}
            >
              {showText ? "Hide" : "Show"}
            </Button>
          ),
          ...props?.InputProps,
        }}
      />
      {isCapsLockOn && (
        <Typography marginTop={1} color="warning.main" display="flex" alignItems="center">
          CapsLock is on
        </Typography>
      )}
    </Stack>
  );
}

export default React.forwardRef(PasswordInput);
