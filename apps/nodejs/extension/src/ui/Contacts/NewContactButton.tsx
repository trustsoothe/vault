import React from "react";
import Button from "@mui/material/Button";
import { themeColors } from "../theme";

interface NewContactButtonProps {
  onClick?: () => void;
}

export default function NewContactButton({ onClick }: NewContactButtonProps) {
  return (
    <Button
      sx={{
        width: 1,
        height: 37,
        borderRadius: "8px",
        backgroundColor: themeColors.white,
        boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.08)",
      }}
      onClick={onClick}
    >
      Create New
    </Button>
  );
}
