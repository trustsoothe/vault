import type { FormValues } from "./index";
import React, { useCallback, useState } from "react";
import Stack from "@mui/material/Stack";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import Typography from "@mui/material/Typography";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import { useTheme } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useFormContext } from "react-hook-form";
import {
  EthereumNetworkFee,
  PocketNetworkFee,
  SupportedProtocols,
} from "@poktscan/keyring";
import Summary from "./Summary/Component";

interface SummaryStepProps {
  hash: string;
  networkFee: PocketNetworkFee | EthereumNetworkFee;
}

const getTransactionLink = (
  protocol: SupportedProtocols,
  chainId: string,
  hash: string
) => {
  if (protocol === SupportedProtocols.Pocket) {
    return `https://poktscan.com/${
      chainId === "testnet" ? "testnet/" : ""
    }tx/${hash}`;
  }

  return "";
};

const TransferSubmittedStep: React.FC<SummaryStepProps> = ({
  hash,
  networkFee,
}) => {
  const theme = useTheme();
  const { watch } = useFormContext<FormValues>();
  const [protocol, chainId] = watch(["protocol", "chainId"]);

  const [showCopyHashTooltip, setShowCopyHashTooltip] = useState(false);
  const handleCopyHash = useCallback(() => {
    if (hash) {
      navigator.clipboard.writeText(hash).then(() => {
        setShowCopyHashTooltip(true);
        setTimeout(() => setShowCopyHashTooltip(false), 500);
      });
    }
  }, [hash]);

  const link = getTransactionLink(protocol, chainId, hash);

  return (
    <Stack flexGrow={1} justifyContent={"space-between"}>
      <Stack>
        <Summary networkFee={networkFee} />
        <Stack
          direction={"row"}
          alignItems={"center"}
          justifyContent={"center"}
          mt={2}
          mb={1}
          spacing={0.5}
        >
          <TaskAltIcon sx={{ fontSize: 20 }} color={"success"} />
          <Typography fontSize={14} fontWeight={600}>
            Transfer submitted successfully!
          </Typography>
        </Stack>
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
    </Stack>
  );
};

export default TransferSubmittedStep;
