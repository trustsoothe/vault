import React from "react";
import { SupportedProtocols } from "@poktscan/vault";
import { selectedProtocolSelector } from "../../redux/selectors/network";
import { useAppSelector } from "../../hooks/redux";
import BaseDialog from "../components/BaseDialog";
import SendPokt from "./SendPokt";
import SendEth from "./SendEth";

interface SendModalProps {
  asset?: {
    contractAddress: string;
    decimals: number;
  };
  open: boolean;
  onClose: () => void;
}

export default function SendCoinsModal({
  open,
  onClose,
  asset,
}: SendModalProps) {
  const selectedProtocol = useAppSelector(selectedProtocolSelector);
  return (
    <BaseDialog open={open} onClose={onClose} title={"Send"}>
      {selectedProtocol === SupportedProtocols.Ethereum ? (
        <SendEth asset={asset} />
      ) : (
        <SendPokt />
      )}
    </BaseDialog>
  );
}
