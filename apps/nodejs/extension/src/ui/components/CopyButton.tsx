import React, { useState } from "react";
import Button from "@mui/material/Button";
import SuccessIcon from "../assets/img/success_icon.svg";
import { themeColors } from "../theme";

interface CopyButtonProps {
  label: string;
  textToCopy: string;
}

export default function CopyButton({ textToCopy, label }: CopyButtonProps) {
  const [showTextWasCopied, setShowTextWasCopied] = useState(false);

  const copyText = () => {
    navigator.clipboard.writeText(textToCopy).then(() => {
      setShowTextWasCopied(true);
      setTimeout(() => setShowTextWasCopied(false), 1500);
    });
  };

  return (
    <Button
      sx={{
        width: 1,
        backgroundColor: themeColors.white,
        boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.08)",
      }}
      onClick={!showTextWasCopied ? copyText : undefined}
    >
      {!showTextWasCopied ? (
        label
      ) : (
        <>
          <SuccessIcon style={{ marginRight: "7px" }} />
          Copied
        </>
      )}
    </Button>
  );
}
