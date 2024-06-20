import type { SupportedProtocols } from "@poktscan/vault";
import React from "react";
import { styled } from "@mui/material";
import Typography from "@mui/material/Typography";
import Stack, { StackProps } from "@mui/material/Stack";
import { AccountAvatar } from "../components/AccountInfo";
import { HeaderContainer } from "../Header/Header";
import { useAppSelector } from "../../hooks/redux";
import {
  networksSelector,
  selectedChainByProtocolSelector,
} from "../../redux/selectors/network";
import {
  accountsSelector,
  selectedAccountByProtocolSelector,
} from "../../redux/selectors/account";
import { WIDTH } from "../../constants/ui";
import { themeColors } from "../theme";

const Container = styled(Stack)<StackProps>(() => ({
  height: 31,
  width: "calc(50% - 6px)",
  columnGap: "7px",
  padding: "7px 11px",
  borderRadius: "8px",
  alignItems: "center",
  flexDirection: "row",
  boxSizing: "border-box",
  backgroundColor: themeColors.white,
  boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.08)",
}));

interface RequestHeaderProps {
  protocol: SupportedProtocols;
  accountAddress?: string;
}

export default function RequestHeader({
  protocol,
  accountAddress,
}: RequestHeaderProps) {
  const networks = useAppSelector(networksSelector);
  const accounts = useAppSelector(accountsSelector);
  const selectedChainByProtocol = useAppSelector(
    selectedChainByProtocolSelector
  );
  const selectedAccountByProtocol = useAppSelector(
    selectedAccountByProtocolSelector
  );

  const selectedChain = selectedChainByProtocol[protocol];
  const address = accountAddress || selectedAccountByProtocol[protocol];

  const selectedAccount = accounts.find(
    (account) => account.address === address && account.protocol === protocol
  );
  const selectedNetwork = networks.find(
    (network) =>
      network.protocol === protocol && network.chainId === selectedChain
  );

  return (
    <HeaderContainer columnGap={1.2} width={WIDTH}>
      <Container>
        <img
          width={15}
          height={15}
          src={selectedNetwork.iconUrl}
          alt={`${selectedNetwork.label} icon`}
        />
        <Typography variant={"subtitle2"} fontWeight={400} noWrap={true}>
          {selectedNetwork.label}
        </Typography>
      </Container>
      <Container>
        <AccountAvatar
          address={selectedAccount.address}
          name={selectedAccount.name}
        />
        <Typography variant={"subtitle2"} fontWeight={400} noWrap={true}>
          {selectedAccount.name}
        </Typography>
      </Container>
    </HeaderContainer>
  );
}
