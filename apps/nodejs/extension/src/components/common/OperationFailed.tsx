import React from "react";
import Stack, { type StackProps } from "@mui/material/Stack";
import Typography, { type TypographyProps } from "@mui/material/Typography";
import Button, { type ButtonProps } from "@mui/material/Button";

interface OperationFailedProps {
  text: string;
  retryBtnText?: string;
  textProps?: TypographyProps;
  onCancel?: () => void;
  onRetry?: () => void;
  containerProps?: StackProps;
  buttonsContainerProps?: StackProps;
  cancelBtnProps?: ButtonProps;
  retryBtnProps?: ButtonProps;
}

const OperationFailed: React.FC<OperationFailedProps> = ({
  text,
  textProps,
  onCancel,
  containerProps,
  buttonsContainerProps,
  retryBtnText = "Retry",
  retryBtnProps,
  cancelBtnProps,
  onRetry,
}) => {
  return (
    <Stack
      flexGrow={1}
      alignItems={"center"}
      justifyContent={"center"}
      spacing={"10px"}
      {...containerProps}
    >
      <Typography textAlign={"center"} {...textProps}>
        {text}
      </Typography>
      <Stack
        direction={"row"}
        width={250}
        spacing={"15px"}
        {...buttonsContainerProps}
      >
        {onCancel && (
          <Button
            variant={"outlined"}
            fullWidth
            onClick={onCancel}
            {...cancelBtnProps}
            sx={{
              textTransform: "none",
              height: 30,
              fontWeight: 500,
              ...cancelBtnProps?.sx,
            }}
          >
            Cancel
          </Button>
        )}
        <Button
          variant={"contained"}
          fullWidth
          type={"submit"}
          {...retryBtnProps}
          sx={{
            textTransform: "none",
            height: 30,
            fontWeight: 600,
            ...retryBtnProps?.sx,
          }}
          onClick={onRetry || retryBtnProps?.onClick}
        >
          {retryBtnText}
        </Button>
      </Stack>
    </Stack>
  );
};

export default OperationFailed;
