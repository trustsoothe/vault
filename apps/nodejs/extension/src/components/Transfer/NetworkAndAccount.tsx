import React, { useMemo } from "react";
import Stack from "@mui/material/Stack";
import { useTheme } from "@mui/material";
import Typography from "@mui/material/Typography";
import { SupportedProtocols } from "@poktscan/keyring";
import { useAppSelector } from "../../hooks/redux";
import { networksSelector } from "../../redux/selectors/network";
import { accountsSelector } from "../../redux/selectors/account";

interface NetworkAndAccountProps {
  protocol: SupportedProtocols;
  chainId: string;
  fromAddress: string;
}

const NetworkAndAccount: React.FC<NetworkAndAccountProps> = ({
  protocol,
  chainId,
  fromAddress,
}) => {
  const theme = useTheme();
  const networks = useAppSelector(networksSelector);
  const accounts = useAppSelector(accountsSelector);

  const selectedNetwork = useMemo(() => {
    return networks.find(
      (network) => network.protocol === protocol && network.chainId === chainId
    );
  }, [networks, protocol, chainId]);

  const selectedAccount = useMemo(() => {
    return accounts.find(
      (account) =>
        account.protocol === protocol && account.address === fromAddress
    );
  }, [accounts, protocol, fromAddress]);

  return (
    <Stack
      direction={"row"}
      paddingX={1.5}
      spacing={1}
      width={1}
      height={50}
      minHeight={50}
      boxSizing={"border-box"}
      alignItems={"center"}
      bgcolor={theme.customColors.primary100}
    >
      <Stack
        width={1}
        height={32}
        direction={"row"}
        boxSizing={"border-box"}
        paddingLeft={0.5}
        alignItems={"center"}
        sx={{
          borderRadius: "18px",
          boxShadow: "0px 0px 6px 0px #1C2D4A26",
          backgroundColor: theme.customColors.white,
          borderBottom: `1.5px solid ${theme.customColors.dark25}`,
        }}
      >
        <img
          src={selectedNetwork?.iconUrl}
          alt={`${selectedNetwork?.protocol}-${selectedNetwork?.chainId}-img`}
          width={24}
          height={24}
        />
        <Typography
          flexGrow={1}
          fontSize={13}
          fontWeight={700}
          marginLeft={0.6}
          letterSpacing={"0.5px"}
        >
          {selectedNetwork?.label}
        </Typography>
      </Stack>
      <Stack
        width={180}
        minWidth={180}
        maxWidth={180}
        height={32}
        boxSizing={"border-box"}
        direction={"row"}
        paddingLeft={0.5}
        alignItems={"center"}
        sx={{
          borderRadius: "18px",
          boxShadow: "0px 0px 6px 0px #1C2D4A26",
          backgroundColor: theme.customColors.white,
          borderBottom: `1.5px solid ${theme.customColors.dark25}`,
        }}
      >
        <Typography
          flexGrow={1}
          fontSize={13}
          fontWeight={700}
          marginLeft={0.6}
          overflow={"hidden"}
          whiteSpace={"nowrap"}
          letterSpacing={"0.5px"}
          textOverflow={"ellipsis"}
        >
          {selectedAccount?.name}
        </Typography>
      </Stack>
    </Stack>
  );
};

export default NetworkAndAccount;
