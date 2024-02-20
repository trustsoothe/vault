import React from "react";
import Stack from "@mui/material/Stack";
import { useTheme } from "@mui/material";
import MuiInfoIcon from "@mui/icons-material/Info";

const InfoIcon: React.FC = () => {
  const theme = useTheme();
  return (
    <Stack
      bgcolor={theme.customColors.primary500}
      width={29.5}
      height={29.5}
      borderRadius={"50%"}
      alignItems={"center"}
      justifyContent={"center"}
    >
      <MuiInfoIcon
        sx={{
          color: theme.customColors.primary100,
          fontSize: 30.5,
        }}
      />
    </Stack>
  );
};

export default InfoIcon;
