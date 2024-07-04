import type { SupportedProtocols } from "@poktscan/vault";
import type { TransactionFormValues } from "./BaseTransaction";
import React, { useState } from "react";
import Stack from "@mui/material/Stack";
import capitalize from "lodash/capitalize";
import Tooltip from "@mui/material/Tooltip";
import { useFormContext } from "react-hook-form";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import { explorerTransactionUrlOfNetworkSelector } from "../../redux/selectors/network";
import CopyIcon from "../assets/img/copy_icon.svg";
import { useAppSelector } from "../hooks/redux";
import { getTruncatedText } from "../../utils/ui";
import { themeColors } from "../theme";

interface HashProps {
  protocol: SupportedProtocols;
  chainId: string;
  hash: string;
}

export function Hash({ hash, protocol, chainId }: HashProps) {
  const [showCopyTooltip, setShowCopyTooltip] = useState(false);

  const explorerTransactionUrl = useAppSelector(
    explorerTransactionUrlOfNetworkSelector(protocol, chainId)
  );
  const link = explorerTransactionUrl?.replace(":hash", hash);

  const url = new URL(link);

  const domain = url.hostname.split(".").at(-2);

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
      <Tooltip
        arrow
        title={`View in ${
          domain === "poktscan" ? "POKTscan" : capitalize(domain)
        }`}
        placement={"top"}
      >
        <Typography
          component={"a"}
          color={themeColors.primary}
          fontWeight={500}
          href={link}
          target={"_blank"}
          sx={{
            textDecoration: "none",
          }}
        >
          {getTruncatedText(hash, 10)}
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

export default function TransactionHash() {
  const { watch } = useFormContext<TransactionFormValues>();
  const [hash, protocol, chainId] = watch([
    "txResultHash",
    "protocol",
    "chainId",
  ]);

  return <Hash protocol={protocol} chainId={chainId} hash={hash} />;
}
