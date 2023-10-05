import React, { useCallback, useState } from "react";
import Summary from "./Summary/Component";
import Stack from "@mui/material/Stack";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import Typography from "@mui/material/Typography";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";

interface SummaryStepProps {
  fromBalance: number;
  hash: string;
}

const TransferSubmittedStep: React.FC<SummaryStepProps> = ({
  fromBalance,
  hash,
}) => {
  const [showCopyHashTooltip, setShowCopyHashTooltip] = useState(false);
  const handleCopyHash = useCallback(() => {
    if (hash) {
      navigator.clipboard.writeText(hash).then(() => {
        setShowCopyHashTooltip(true);
        setTimeout(() => setShowCopyHashTooltip(false), 500);
      });
    }
  }, [hash]);

  return (
    <Stack>
      <Summary fromBalance={fromBalance} />
      <Stack
        direction={"row"}
        alignItems={"center"}
        justifyContent={"center"}
        mt={1.5}
        mb={1}
        spacing={0.5}
      >
        <TaskAltIcon sx={{ fontSize: 20 }} color={"success"} />
        <Typography fontSize={14} fontWeight={600}>
          Transfer submitted successfully!
        </Typography>
      </Stack>
      <Stack direction={"row"} mb={1} spacing={0.7}>
        <Typography fontSize={12} fontWeight={600}>
          Hash:
        </Typography>
        <Typography fontSize={12} sx={{ wordBreak: "break-all" }}>
          <a
            href={`https://poktscan.com/tx/${hash}`}
            style={{ color: "#2073c5", fontWeight: 600 }}
            target={"_blank"}
          >
            {hash}
          </a>{" "}
          <Tooltip title={"Copied"} open={showCopyHashTooltip}>
            <IconButton
              sx={{ padding: 0, marginLeft: 0.3, marginTop: -0.2 }}
              onClick={handleCopyHash}
            >
              <ContentCopyIcon sx={{ fontSize: 14 }} />
            </IconButton>
          </Tooltip>
        </Typography>
      </Stack>
    </Stack>
  );
};

export default TransferSubmittedStep;
