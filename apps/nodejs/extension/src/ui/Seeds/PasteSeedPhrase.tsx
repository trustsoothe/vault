import Button from "@mui/material/Button";
import React from "react";

export default function PasteSeedPhrase() {
  return (
    <Button
      fullWidth
      sx={{
        height: 38,
        borderRadius: "8px",
        boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.08)",
      }}
    >
      Paste Seed
    </Button>
  );
}
