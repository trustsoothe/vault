import React, { useState } from "react";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import CopyIcon from "../assets/img/copy_icon.svg";
import { themeColors } from "../theme";

export default function TransactionHash() {
  const hash = "39B02FV2F6704N191X62";
  const [showCopyTooltip, setShowCopyTooltip] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(hash).then(() => {
      setShowCopyTooltip(true);
      setTimeout(() => setShowCopyTooltip(false), 1000);
    });
  };

  return (
    <Stack
      alignItems={"center"}
      justifyContent={"flex-end"}
      direction={"row"}
      spacing={0.5}
    >
      <Tooltip arrow title={"View in Poktscan"} placement={"top"}>
        <Typography
          component={"a"}
          color={themeColors.primary}
          fontWeight={500}
          href={"https://poktscan.com"}
          target={"_blank"}
          sx={{
            textDecoration: "none",
          }}
        >
          39B02FV2F6…704N191X62
        </Typography>
      </Tooltip>
      <Tooltip arrow title={"Copied"} placement={"top"} open={showCopyTooltip}>
        <IconButton onClick={handleCopy}>
          <CopyIcon />
        </IconButton>
      </Tooltip>
    </Stack>
  );
}
