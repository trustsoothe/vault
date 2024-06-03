import React from "react";
import Stack from "@mui/material/Stack";
import Button, { ButtonProps } from "@mui/material/Button";

interface DialogButtonsProps {
  secondaryButtonProps?: ButtonProps;
  primaryButtonProps: ButtonProps;
}

export default function DialogButtons({
  primaryButtonProps,
  secondaryButtonProps,
}: DialogButtonsProps) {
  return (
    <Stack
      spacing={1.2}
      direction={"row"}
      sx={{
        width: 1,
        height: 1,
        padding: 2.4,
        boxSizing: "border-box",
        backgroundColor: "#f7f8f9",
        boxShadow: "0 -1px 0 0 #eff1f4",
      }}
    >
      {secondaryButtonProps && (
        <Button
          fullWidth
          {...secondaryButtonProps}
          sx={{
            backgroundColor: "#fff",
            color: "#484f59",
            boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.08)",
            ...secondaryButtonProps.sx,
          }}
        />
      )}
      <Button fullWidth variant={"contained"} {...primaryButtonProps} />
    </Stack>
  );
}
