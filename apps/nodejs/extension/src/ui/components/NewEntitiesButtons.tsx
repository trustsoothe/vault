import React from "react";
import Stack, { StackProps } from "@mui/material/Stack";
import Button, { ButtonProps } from "@mui/material/Button";
import { themeColors } from "../theme";

interface NewEntitiesButtonsProps {
  containerProps?: StackProps;
  importProps?: ButtonProps;
  createProps?: ButtonProps;
}

export default function NewEntitiesButtons({
  containerProps,
  importProps,
  createProps,
}: NewEntitiesButtonsProps) {
  return (
    <Stack
      width={1}
      spacing={1.2}
      marginTop={5}
      paddingX={2.4}
      direction={"row"}
      alignItems={"center"}
      boxSizing={"border-box"}
      {...containerProps}
      sx={{
        ...containerProps?.sx,
        button: {
          width: 160,
          height: 37,
          backgroundColor: themeColors.white,
          boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.08)",
          ...containerProps?.sx?.["button"],
        },
      }}
    >
      <Button {...importProps}>Import</Button>
      <Button
        {...createProps}
        sx={{ color: themeColors.black, ...createProps?.sx }}
      >
        Create New
      </Button>
    </Stack>
  );
}
