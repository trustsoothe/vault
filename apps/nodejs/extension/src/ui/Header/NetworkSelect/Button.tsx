import React, { useMemo } from "react";
import MuiButton from "@mui/material/Button";
import { themeColors } from "../../theme";
import { useAppSelector } from "../../hooks/redux";
import ExpandIcon from "../../assets/img/expand_select_icon.svg";
import { NetworkOption } from "./NetworkSelect";
import {
  selectedChainSelector,
  selectedProtocolSelector,
} from "../../../redux/selectors/network";

interface ButtonProps {
  onClick: () => void;
}

export default function Button({ onClick }: ButtonProps) {
  const selectedChain = useAppSelector(selectedChainSelector);
  const selectedProtocol = useAppSelector(selectedProtocolSelector);
  const networks = useAppSelector((state) => state.app.networks);

  const selectedOption: NetworkOption = useMemo(() => {
    return {
      protocol: selectedProtocol,
      chainId: selectedChain,
    };
  }, [selectedProtocol, selectedChain]);

  const selectedOptionIconUrl = networks.find(
    (network) =>
      network.protocol === selectedOption.protocol &&
      network.chainId === selectedOption.chainId
  )?.iconUrl;

  return (
    <MuiButton
      sx={{
        width: 60,
        height: 31,
        paddingX: 1,
        paddingY: 0.8,
        minWidth: 60,
        borderRadius: "8px",
        justifyContent: "space-between",
        backgroundColor: themeColors.white,
        boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.08)",
      }}
      onClick={onClick}
    >
      <img
        src={selectedOptionIconUrl}
        alt={`${selectedOption.protocol}-${selectedOption.chainId}-img`}
        width={15}
        height={15}
      />
      <ExpandIcon />
    </MuiButton>
  );
}
