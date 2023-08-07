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

const CircularLoading: React.FC<CircularLoadingProps> = ({
  containerProps,
  circularProps,
  text,
}) => {
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
};

export default CircularLoading;
