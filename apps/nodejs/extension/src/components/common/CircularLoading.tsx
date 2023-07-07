import React from "react";
import Stack, { type StackProps } from "@mui/material/Stack";
import CircularProgress, {
  type CircularProgressProps,
} from "@mui/material/CircularProgress";

interface CircularLoadingProps {
  containerProps?: StackProps;
  circularProps?: CircularProgressProps;
}

const CircularLoading: React.FC<CircularLoadingProps> = ({
  containerProps,
  circularProps,
}) => {
  return (
    <Stack
      flexGrow={1}
      alignItems={"center"}
      justifyContent={"center"}
      {...containerProps}
    >
      <CircularProgress
        size={80}
        {...circularProps}
        sx={{
          marginTop: "-40px",
          ...circularProps?.sx,
        }}
      />
    </Stack>
  );
};

export default CircularLoading;
