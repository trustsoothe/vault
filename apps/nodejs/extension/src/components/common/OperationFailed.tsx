import React from "react";
import { useTheme } from "@mui/material";
import Stack, { type StackProps } from "@mui/material/Stack";
import Typography, { type TypographyProps } from "@mui/material/Typography";
import Button, { type ButtonProps } from "@mui/material/Button";

interface OperationFailedProps {
  text: string;
  retryBtnText?: string;
  cancelBtnText?: string;
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
  cancelBtnText = "Cancel",
  retryBtnProps,
  cancelBtnProps,
  onRetry,
}) => {
  const theme = useTheme();
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
              fontWeight: 700,
              color: theme.customColors.dark50,
              borderColor: theme.customColors.dark50,
              height: 36,
              borderWidth: 1.5,
              fontSize: 16,
              ...cancelBtnProps?.sx,
            }}
          >
            {cancelBtnText}
          </Button>
        )}
        <Button
          variant={"contained"}
          fullWidth
          type={"submit"}
          {...retryBtnProps}
          sx={{
            fontWeight: 700,
            height: 36,
            fontSize: 16,
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
