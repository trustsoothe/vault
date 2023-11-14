import type { SerializedNetwork } from "@poktscan/keyring";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import Tab from "@mui/material/Tab";
import orderBy from "lodash/orderBy";
import TabList from "@mui/lab/TabList";
import Stack from "@mui/material/Stack";
import { useTheme } from "@mui/material";
import Button from "@mui/material/Button";
import TabContext from "@mui/lab/TabContext";
import Typography from "@mui/material/Typography";
import { useNavigate, useSearchParams } from "react-router-dom";
import { labelByProtocolMap } from "../../constants/protocols";
import {
  ADD_NETWORK_PAGE,
  REMOVE_NETWORK_PAGE,
  UPDATE_NETWORK_PAGE,
} from "../../constants/routes";
import { Network, toggleNetworkCanBeSelected } from "../../redux/slices/app";
import { useAppDispatch, useAppSelector } from "../../hooks/redux";

enum NetworkTabs {
  defaults = "defaults",
  customs = "customs",
}

interface NetworkItemProps {
  network: Network;
  onClickUpdate?: (network: SerializedNetwork) => void;
  onClickRemove?: (network: SerializedNetwork) => void;
}

export const NetworkItem: React.FC<NetworkItemProps> = ({ network }) => {
  const theme = useTheme();
  const dispatch = useAppDispatch();

  const toggleCanBeSelected = useCallback(() => {
    dispatch(toggleNetworkCanBeSelected(network));
  }, [dispatch, network]);

  const canBeSelected =
    useAppSelector((state) =>
      state.app.networksCanBeSelected[network.protocol].includes(
        network.chainId
      )
    ) || network.isDefault;

  const selectedChain = useAppSelector(
    (state) => state.app.selectedChainByNetwork[state.app.selectedNetwork]
  );

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
  const theme = useTheme();
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState(NetworkTabs.defaults);
  const networks = useAppSelector((state) => state.app.networks);

  useEffect(() => {
    const tabOnQuery = searchParams.get("tab");

    if (tabOnQuery && tabOnQuery in NetworkTabs) {
      setTab(tabOnQuery as NetworkTabs);
    }
  }, []);

  const onChangeTab = useCallback(
    (_: React.SyntheticEvent, newTab: NetworkTabs) => {
      setTab(newTab);
    },
    []
  );

  const navigate = useNavigate();

  const onClickAdd = useCallback(() => {
    navigate(ADD_NETWORK_PAGE);
  }, [navigate]);

  const onClickUpdate = useCallback(
    (network: SerializedNetwork) => {
      navigate(`${UPDATE_NETWORK_PAGE}?id=${network.id}`);
    },
    [navigate]
  );

  const onClickRemove = useCallback(
    (network: SerializedNetwork) => {
      navigate(`${REMOVE_NETWORK_PAGE}?id=${network.id}`);
    },
    [navigate]
  );

  const networksList = useMemo(() => {
    return (
      <Stack
        height={1}
        width={1}
        marginTop={1.5}
        justifyContent={"space-between"}
      >
        <Stack
          spacing={1.5}
          overflow={"auto"}
          maxHeight={tab === NetworkTabs.customs ? 400 : 450}
        >
          {networks.length ? (
            orderBy(
              networks.map((item) => ({
                ...item,
                rank: item.isDefault ? 1 : 2,
              })),
              ["rank"],
              ["asc"]
            ).map((network) => (
              <NetworkItem
                network={network}
                key={network.id}
                onClickUpdate={!network.isDefault ? onClickUpdate : undefined}
                onClickRemove={!network.isDefault ? onClickRemove : undefined}
              />
            ))
          ) : (
            <Stack justifyContent={"center"} alignItems={"center"} flexGrow={1}>
              <Typography mt={"-50px"}>
                You don't have any custom network yet.
              </Typography>
            </Stack>
          )}
        </Stack>
        {tab === NetworkTabs.customs && (
          <Button
            variant={"contained"}
            fullWidth
            sx={{
              backgroundColor: theme.customColors.primary500,
              height: 35,
              fontWeight: 700,
              fontSize: 16,
            }}
            onClick={onClickAdd}
          >
            Add Custom Network
          </Button>
        )}
      </Stack>
    );
  }, [networks, tab, onClickRemove, onClickUpdate, onClickAdd]);

  return (
    <Stack
      flexGrow={1}
      height={1}
      marginTop={1.5}
      sx={{
        "& .MuiTabPanel-root": {
          padding: 0,
          display: "flex",
        },
      }}
    >
      <TabContext value={tab}>
        <TabList
          variant={"fullWidth"}
          onChange={onChangeTab}
          sx={{
            height: 40,
            minHeight: 40,
            borderBottom: `1px solid ${theme.customColors.dark15}`,
            "& .MuiTabs-flexContainer": {
              paddingX: 2,
            },
            "& .MuiTabs-flexContainer, button": {
              height: 40,
              minHeight: 40,
            },
            "& button": {
              fontWeight: 700,
              fontSize: 12,
              color: theme.customColors.dark50,
            },
            "& button.Mui-selected": {
              color: theme.customColors.primary500,
            },
          }}
        >
          <Tab label={"DEFAULTS"} value={NetworkTabs.defaults} />
          <Tab label={"CUSTOMS"} value={NetworkTabs.customs} />
        </TabList>
      </TabContext>
      {networksList}
    </Stack>
  );
};

export default NetworkList;
