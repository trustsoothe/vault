import React from "react";
import Stack, { StackProps } from "@mui/material/Stack";
import Button, { ButtonProps } from "@mui/material/Button";
import LoadingButton, { LoadingButtonProps } from "./LoadingButton";

interface DialogButtonsProps {
  secondaryButtonProps?: ButtonProps;
  primaryButtonProps: LoadingButtonProps;
  containerProps?: StackProps;
}

export default function DialogButtons({
  containerProps,
  primaryButtonProps,
  secondaryButtonProps,
}: DialogButtonsProps) {
  return (
    <Stack
      spacing={1.2}
      direction={"row"}
      {...containerProps}
      sx={{
        width: 1,
        height: 1,
        paddingX: 1.6,
        paddingY: 1.2,
        boxSizing: "border-box",
        backgroundColor: "#f7f8f9",
        boxShadow: "0 -1px 0 0 #eff1f4",
        ...containerProps?.sx,
      }}
    >
      {secondaryButtonProps && (
        <Button
          fullWidth
          {...secondaryButtonProps}
          sx={{
            height: 32,
            color: "#484f59",
            backgroundColor: "#fff",
            boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.08)",
            ...secondaryButtonProps.sx,
          }}
        />
      )}
      <LoadingButton fullWidth {...primaryButtonProps} />
    </Stack>
  );
}
