import type { SerializedNetwork } from "@poktscan/keyring";
import type { RootState } from "../../redux/store";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import Tab from "@mui/material/Tab";
import { connect } from "react-redux";
import TabList from "@mui/lab/TabList";
import Stack from "@mui/material/Stack";
import { useTheme } from "@mui/material";
import Button from "@mui/material/Button";
import TabContext from "@mui/lab/TabContext";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import { useNavigate, useSearchParams } from "react-router-dom";
import { labelByProtocolMap, labelByChainID } from "../../constants/protocols";
import {
  ADD_NETWORK_PAGE,
  REMOVE_NETWORK_PAGE,
  UPDATE_NETWORK_PAGE,
} from "../../constants/routes";
import EditIcon from "../../assets/img/edit_outlined_icon.svg";
import RemoveIcon from "../../assets/img/trash_icon.svg";

enum NetworkTabs {
  defaults = "defaults",
  customs = "customs",
}

interface NetworkItemProps {
  network: SerializedNetwork;
  onClickUpdate?: (network: SerializedNetwork) => void;
  onClickRemove?: (network: SerializedNetwork) => void;
}

export const NetworkItem: React.FC<NetworkItemProps> = ({
  network,
  onClickUpdate,
  onClickRemove,
}) => {
  const theme = useTheme();
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
        <Typography
          fontSize={14}
          fontWeight={500}
          letterSpacing={"0.5px"}
          lineHeight={"30px"}
        >
          {network.name}
        </Typography>
        <Stack direction={"row"} alignItems={"center"} marginRight={-0.4}>
          {onClickUpdate && (
            <IconButton onClick={() => onClickUpdate(network)}>
              <EditIcon />
            </IconButton>
          )}
          {onClickRemove && (
            <IconButton onClick={() => onClickRemove(network)}>
              <RemoveIcon />
            </IconButton>
          )}
        </Stack>
      </Stack>
      <Typography fontSize={12} lineHeight={"20px"} letterSpacing={"0.5px"}>
        {labelByProtocolMap[network.protocol] || network.protocol} -{" "}
        {labelByChainID[network.chainID] || network.chainID}
      </Typography>
      <Typography
        fontSize={12}
        component={"a"}
        target={"_blank"}
        lineHeight={"20px"}
        href={network.rpcUrl}
        letterSpacing={"0.5px"}
        color={theme.customColors.primary500}
      >
        {network.rpcUrl}
      </Typography>
    </Stack>
  );
};

interface NetworkListProps {
  networks: SerializedNetwork[];
}

const NetworkList: React.FC<NetworkListProps> = ({ networks }) => {
  const theme = useTheme();
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState(NetworkTabs.defaults);

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
    const list = networks.filter((network) =>
      tab === NetworkTabs.defaults ? network.isDefault : !network.isDefault
    );

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
          {list.length ? (
            list.map((network) => (
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

const mapStateToProps = (state: RootState) => {
  return {
    networks: state.vault.entities.networks.list,
  };
};

export default connect(mapStateToProps)(NetworkList);
