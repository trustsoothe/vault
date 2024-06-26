import React from "react";
import { SupportedProtocols } from "@poktscan/vault";
import { selectedProtocolSelector } from "../../redux/selectors/network";
import { useAppSelector } from "../../hooks/redux";
import BaseDialog from "../components/BaseDialog";
import SendPokt from "./SendPokt";
import SendEth from "./SendEth";

interface SendModalProps {
  open: boolean;
  onClose: () => void;
  isSwapping?: boolean;
}

export default function SendCoinsModal({
  open,
  onClose,
  isSwapping,
}: SendModalProps) {
  const selectedProtocol = useAppSelector(selectedProtocolSelector);
  return (
    <BaseDialog
      open={open}
      onClose={onClose}
      title={isSwapping ? "Swap" : "Send"}
    >
      {selectedProtocol === SupportedProtocols.Ethereum ? (
        <SendEth onCancel={onClose} isUnwrapping={isSwapping} />
      ) : (
        <SendPokt onCancel={onClose} isWrapping={isSwapping} />
      )}
    </BaseDialog>
  );
}
