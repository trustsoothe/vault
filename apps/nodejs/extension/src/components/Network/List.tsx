import React, { useCallback, useMemo, useState } from "react";
import { SerializedNetwork } from "@poktscan/keyring";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Divider, IconButton } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import AddUpdateNetwork from "./AddUpdate";
import RemoveNetwork from "./Remove";
import { RootState } from "../../redux/store";
import { connect } from "react-redux";
import groupBy from "lodash/groupBy";
import { labelByProtocolMap, labelByChainID } from "../../constants/protocols";

interface NetworkItemProps {
  network: SerializedNetwork;
  onClickUpdate?: (network: SerializedNetwork) => void;
  onClickRemove?: (network: SerializedNetwork) => void;
}

const NetworkItem: React.FC<NetworkItemProps> = ({
  network,
  onClickUpdate,
  onClickRemove,
}) => {
  return (
    <Stack direction={"row"}>
      <Stack paddingX={"5px"} spacing={"3px"} flexGrow={1}>
        <Typography fontSize={12} fontWeight={600}>
          {network.name}
        </Typography>
        <Stack direction={"row"} alignItems={"center"} spacing={"7px"}>
          <Typography fontSize={12}>
            {labelByProtocolMap[network.protocol.name]}
          </Typography>
          <Typography fontSize={12}>-</Typography>
          <Typography fontSize={12}>
            {labelByChainID[network.protocol.chainID]}
          </Typography>
        </Stack>
        <Typography
          fontSize={10}
          color={"dimgrey"}
          sx={{ textDecoration: "underline" }}
        >
          {network.rpcUrl}
        </Typography>
      </Stack>
      <Stack spacing={"10px"} width={"min-content"}>
        {onClickUpdate && (
          <IconButton
            sx={{ padding: 0 }}
            onClick={() => onClickUpdate(network)}
          >
            <EditIcon sx={{ fontSize: 18 }} />
          </IconButton>
        )}
        {onClickRemove && (
          <IconButton
            sx={{ padding: 0 }}
            onClick={() => onClickRemove(network)}
          >
            <DeleteIcon sx={{ fontSize: 18 }} />
          </IconButton>
        )}
      </Stack>
    </Stack>
  );
};

interface NetworkListProps {
  networks: SerializedNetwork[];
  isLoading: boolean;
}

const NetworkList: React.FC<NetworkListProps> = ({ networks, isLoading }) => {
  const [selectedNetwork, setSelectedNetwork] =
    useState<SerializedNetwork>(null);
  const [view, setView] = useState<"list" | "addUpdate" | "remove">("list");

  const onClickAdd = useCallback(() => {
    setView("addUpdate");
  }, []);

  const onClickUpdate = useCallback((network: SerializedNetwork) => {
    setSelectedNetwork(network);
    setView("addUpdate");
  }, []);

  const onClickRemove = useCallback((network: SerializedNetwork) => {
    setSelectedNetwork(network);
    setView("remove");
  }, []);

  const onClose = useCallback(() => {
    setSelectedNetwork(null);
    setView("list");
  }, []);

  const [defaultNetworks, customNetworks] = useMemo(() => {
    const groupedNetworks = groupBy(networks, "isDefault");
    return [groupedNetworks["true"], groupedNetworks["false"] || []];
  }, [networks]);

  const content = useMemo(() => {
    if (view === "addUpdate") {
      return (
        <AddUpdateNetwork onClose={onClose} networkToUpdate={selectedNetwork} />
      );
    }

    if (selectedNetwork && view === "remove") {
      return <RemoveNetwork network={selectedNetwork} onClose={onClose} />;
    }

    return (
      <Stack height={1} boxSizing={"border-box"} paddingBottom={"20px"}>
        <Stack
          marginRight={"-10px"}
          marginTop={"15px"}
          direction={"row"}
          alignItems={"center"}
          justifyContent={"space-between"}
        >
          <Typography fontSize={18}>Network List</Typography>
          <Button sx={{ textTransform: "none" }} onClick={onClickAdd}>
            + Add
          </Button>
        </Stack>

        <Box overflow={"auto"} marginRight={"-10px"} paddingRight={"10px"}>
          <Divider
            textAlign={"left"}
            sx={{
              marginY: "10px",
              "&::before": {
                width: "4%",
              },
              "& .MuiDivider-wrapper": {
                paddingX: "7px",
              },
            }}
          >
            <Typography fontSize={14}>Defaults</Typography>
          </Divider>
          <Stack divider={<Divider sx={{ marginY: "10px" }} />}>
            {defaultNetworks.map((network) => (
              <NetworkItem network={network} key={network.id} />
            ))}
          </Stack>
          {customNetworks.length ? (
            <>
              <Divider
                textAlign={"left"}
                sx={{
                  marginTop: "15px",
                  marginBottom: "10px",

                  "&::before": {
                    width: "4%",
                  },
                  "& .MuiDivider-wrapper": {
                    paddingX: "7px",
                  },
                }}
              >
                <Typography fontSize={14}>Customs</Typography>
              </Divider>
              <Stack divider={<Divider sx={{ marginY: "10px" }} />}>
                {customNetworks.map((network) => (
                  <NetworkItem
                    network={network}
                    key={network.id}
                    onClickRemove={onClickRemove}
                    onClickUpdate={onClickUpdate}
                  />
                ))}
              </Stack>
            </>
          ) : null}
        </Box>
      </Stack>
    );
  }, [
    selectedNetwork,
    onClose,
    networks,
    isLoading,
    onClickRemove,
    onClickUpdate,
    onClickAdd,
    view,
  ]);

  return (
    <Stack flexGrow={1} height={1}>
      {content}
    </Stack>
  );
};

const mapStateToProps = (state: RootState) => {
  return {
    networks: state.vault.entities.networks.list,
    isLoading: state.vault.entities.networks.loading,
  };
};

export default connect(mapStateToProps)(NetworkList);
