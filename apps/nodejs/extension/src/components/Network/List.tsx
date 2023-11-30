import React, { useCallback, useMemo } from "react";
import orderBy from "lodash/orderBy";
import Stack from "@mui/material/Stack";
import { useTheme } from "@mui/material";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { labelByProtocolMap } from "../../constants/protocols";
import { Network, toggleNetworkCanBeSelected } from "../../redux/slices/app";
import { useAppDispatch, useAppSelector } from "../../hooks/redux";
import {
  canNetworkBeSelected,
  networksSelector,
  selectedChainSelector,
} from "../../redux/selectors/network";

interface NetworkItemProps {
  network: Network;
}

const NetworkItem: React.FC<NetworkItemProps> = ({ network }) => {
  const theme = useTheme();
  const dispatch = useAppDispatch();

  const toggleCanBeSelected = useCallback(() => {
    dispatch(toggleNetworkCanBeSelected(network));
  }, [dispatch, network]);

  const selectedChain = useAppSelector(selectedChainSelector);
  const canBeSelected = useAppSelector(canNetworkBeSelected(network));

  return (
    <Stack
      height={85}
      paddingX={1}
      paddingTop={0.5}
      paddingBottom={1}
      borderRadius={"4px"}
      boxSizing={"border-box"}
      bgcolor={theme.customColors.dark2}
      border={`1px solid ${theme.customColors.dark15}`}
    >
      <Stack
        direction={"row"}
        alignItems={"center"}
        justifyContent={"space-between"}
        height={30}
      >
        <Stack direction={"row"} alignItems={"center"} spacing={0.5}>
          <img
            src={network.iconUrl}
            alt={`${network.protocol}-${network.chainId}-img`}
            width={24}
            height={24}
          />
          <Typography
            fontSize={14}
            fontWeight={500}
            letterSpacing={"0.5px"}
            lineHeight={"30px"}
          >
            {network.label} ({network.currencySymbol})
          </Typography>
        </Stack>
        {!network.isDefault && (
          <Button
            disabled={selectedChain === network.chainId}
            sx={{
              fontSize: 12,
              paddingX: 0.4,
              paddingY: 0,
              height: 24,
            }}
            variant={"outlined"}
            onClick={toggleCanBeSelected}
          >
            {canBeSelected ? "Remove" : "Add"}
          </Button>
        )}
      </Stack>
      <Typography fontSize={12} lineHeight={"20px"} letterSpacing={"0.5px"}>
        Protocol: {labelByProtocolMap[network.protocol] || network.protocol}
      </Typography>
      <Typography fontSize={12} lineHeight={"20px"} letterSpacing={"0.5px"}>
        Chain ID: {network.chainIdLabel}
      </Typography>
    </Stack>
  );
};

const NetworkList: React.FC = () => {
  const networks = useAppSelector(networksSelector);

  const networksOrdered = useMemo(() => {
    return orderBy(
      networks.map((item) => ({
        ...item,
        rank: item.isDefault ? 1 : 2,
      })),
      ["rank"],
      ["asc"]
    );
  }, [networks]);

  return (
    <Stack
      height={1}
      width={1}
      marginTop={1.5}
      justifyContent={"space-between"}
      spacing={1.5}
      overflow={"auto"}
      maxHeight={450}
    >
      {networksOrdered.map((network) => (
        <NetworkItem network={network} key={network.id} />
      ))}
    </Stack>
  );
};

export default NetworkList;
