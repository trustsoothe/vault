import React from "react";
import Button, { ButtonProps } from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import { themeColors } from "../theme";

export interface LoadingButtonProps extends ButtonProps {
  isLoading?: boolean;
}

function LoadingButton(
  { isLoading, ...buttonProps }: LoadingButtonProps,
  ref: React.ForwardedRef<HTMLButtonElement>
) {
  return (
    <Button
      variant={"contained"}
      {...buttonProps}
      ref={ref}
      onClick={!isLoading ? buttonProps.onClick : undefined}
      disabled={buttonProps.disabled || isLoading}
      sx={{
        backgroundColor: isLoading
          ? `${themeColors.dark_primary}!important`
          : undefined,
        ...buttonProps.sx,
      }}
    >
      {isLoading ? (
        <CircularProgress size={24} sx={{ color: themeColors.white }} />
      ) : (
        buttonProps.children
      )}
    </Button>
  );
}

export default React.forwardRef(LoadingButton);
