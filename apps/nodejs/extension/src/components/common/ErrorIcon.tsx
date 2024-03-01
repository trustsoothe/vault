import React from "react";
import Stack from "@mui/material/Stack";
import { useTheme } from "@mui/material";
import MuiErrorIcon from "@mui/icons-material/Cancel";

const ErrorIcon: React.FC = () => {
  const theme = useTheme();
  return (
    <Stack
      bgcolor={theme.customColors.red100}
      width={29.5}
      height={29.5}
      borderRadius={"50%"}
      alignItems={"center"}
      justifyContent={"center"}
    >
      <MuiErrorIcon
        sx={{
          color: theme.customColors.red5,
          fontSize: 30,
        }}
      />
    </Stack>
  );
};

export default ErrorIcon;
