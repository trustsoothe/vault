import type { SxProps } from "@mui/material";
import React, { useState } from "react";
import Button from "@mui/material/Button";
import Tooltip from "@mui/material/Tooltip";
import { getTruncatedText } from "../../utils/ui";
import CopyIcon from "../assets/img/copy_icon.svg";
import { themeColors } from "../theme";

interface CopyAddressButtonProps {
  address: string;
  sxProps?: SxProps;
}

export default function CopyAddressButton({
  address,
  sxProps,
}: CopyAddressButtonProps) {
  const [showCopyTooltip, setShowCopyTooltip] = useState(false);

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(address).then(() => {
      setShowCopyTooltip(true);

      setTimeout(() => setShowCopyTooltip(false), 1000);
    });
  };

  return (
    <Tooltip title={"Copied"} placement={"bottom"} open={showCopyTooltip}>
      <Button
        onClick={handleCopyAddress}
        sx={{
          height: 24,
          paddingX: 0.7,
          paddingY: 0.4,
          columnGap: 0.3,
          fontWeight: 400,
          borderRadius: "6px",
          color: themeColors.textSecondary,
          backgroundColor: themeColors.white,
          boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.08)",
          ...sxProps,
        }}
      >
        {getTruncatedText(address, 5)} <CopyIcon />
      </Button>
    </Tooltip>
  );
}
