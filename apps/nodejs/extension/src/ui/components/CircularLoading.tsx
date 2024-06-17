import React from "react";
import Stack, { type StackProps } from "@mui/material/Stack";
import CircularProgress, {
  type CircularProgressProps,
} from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";

interface CircularLoadingProps {
  containerProps?: StackProps;
  circularProps?: CircularProgressProps;
  text?: string;
}

export default function CircularLoading({
  containerProps,
  circularProps,
  text,
}: CircularLoadingProps) {
  return (
    <Stack
      flexGrow={1}
      alignItems={"center"}
      justifyContent={"center"}
      marginTop={-4}
      spacing={1}
      {...containerProps}
    >
      {text && (
        <Typography fontSize={14} fontWeight={600}>
          {text}
        </Typography>
      )}
      <CircularProgress
        size={80}
        {...circularProps}
        sx={{
          ...circularProps?.sx,
        }}
      />
    </Stack>
  );
}
