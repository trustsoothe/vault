import type { FormValues } from "./index";
import Stack from "@mui/material/Stack";
import { useTheme } from "@mui/material";
import Tooltip from "@mui/material/Tooltip";
import { useFormContext } from "react-hook-form";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import React, { useCallback, useState } from "react";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import Summary from "./Summary/Component";
import { useAppSelector } from "../../hooks/redux";
import { explorerTransactionUrlOfNetworkSelector } from "../../redux/selectors/network";

interface SummaryStepProps {
  hash: string;
}

const TransferSubmittedStep: React.FC<SummaryStepProps> = ({ hash }) => {
  const theme = useTheme();
  const { watch } = useFormContext<FormValues>();
  const [protocol, chainId] = watch(["protocol", "chainId"]);

  const explorerTransactionUrl = useAppSelector(
    explorerTransactionUrlOfNetworkSelector(protocol, chainId)
  );

  const [showCopyHashTooltip, setShowCopyHashTooltip] = useState(false);
  const handleCopyHash = useCallback(() => {
    if (hash) {
      navigator.clipboard.writeText(hash).then(() => {
        setShowCopyHashTooltip(true);
        setTimeout(() => setShowCopyHashTooltip(false), 500);
      });
    }
  }, [hash]);

  const link = explorerTransactionUrl?.replace(":hash", hash);

  return (
    <Stack flexGrow={1} justifyContent={"space-between"}>
      <Stack>
        <Summary />
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
