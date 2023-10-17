import type { Protocol } from "@poktscan/keyring/dist/lib/core/common/Protocol";
import React, { useCallback, useState } from "react";
import Summary from "./Summary/Component";
import Stack from "@mui/material/Stack";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import Typography from "@mui/material/Typography";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import { useTheme } from "@mui/material";
import Button from "@mui/material/Button";
import { useNavigate } from "react-router-dom";
import { SupportedProtocols } from "@poktscan/keyring";
import { ACCOUNTS_PAGE } from "../../constants/routes";

interface SummaryStepProps {
  fromBalance: number;
  hash: string;
  protocol: Protocol;
}

const getTransactionLink = (protocol: Protocol, hash: string) => {
  if (protocol.name === SupportedProtocols.Pocket) {
    return `https://poktscan.com/${
      protocol.chainID === "testnet" ? "testnet/" : ""
    }tx/${hash}`;
  }

  return "";
};

const TransferSubmittedStep: React.FC<SummaryStepProps> = ({
  fromBalance,
  hash,
  protocol,
}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [showCopyHashTooltip, setShowCopyHashTooltip] = useState(false);
  const handleCopyHash = useCallback(() => {
    if (hash) {
      navigator.clipboard.writeText(hash).then(() => {
        setShowCopyHashTooltip(true);
        setTimeout(() => setShowCopyHashTooltip(false), 500);
      });
    }
  }, [hash]);

  const link = getTransactionLink(protocol, hash);

  return (
    <Stack flexGrow={1} justifyContent={"space-between"}>
      <Stack>
        <Summary fromBalance={fromBalance} />
        <Stack
          direction={"row"}
          alignItems={"center"}
          justifyContent={"center"}
          mt={2.5}
          mb={2}
          spacing={0.5}
        >
          <TaskAltIcon sx={{ fontSize: 20 }} color={"success"} />
          <Typography fontSize={14} fontWeight={600}>
            Transfer submitted successfully!
          </Typography>
        </Stack>
        <Typography fontSize={13} fontWeight={600}>
          Hash:
        </Typography>
        <Typography fontSize={12} sx={{ wordBreak: "break-all" }}>
          <a
            href={link}
            style={{ color: theme.customColors.primary500, fontWeight: 600 }}
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
      <Button
        sx={{
          fontWeight: 700,
          height: 36,
          fontSize: 16,
        }}
        onClick={() => navigate(ACCOUNTS_PAGE)}
        variant={"contained"}
        fullWidth
      >
        Done
      </Button>
    </Stack>
  );
};

export default TransferSubmittedStep;
