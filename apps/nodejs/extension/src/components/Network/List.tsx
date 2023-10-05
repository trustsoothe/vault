import type { SerializedNetwork } from "@poktscan/keyring";
import type { RootState } from "../../redux/store";
import React, { CSSProperties, useCallback, useMemo } from "react";
import Box from "@mui/material/Box";
import groupBy from "lodash/groupBy";
import { connect } from "react-redux";
import Stack from "@mui/material/Stack";
import Divider from "@mui/material/Divider";
import { useNavigate } from "react-router-dom";
import { FixedSizeList } from "react-window";
import EditIcon from "@mui/icons-material/Edit";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import DeleteIcon from "@mui/icons-material/Delete";
import { labelByProtocolMap, labelByChainID } from "../../constants/protocols";
import {
  ADD_NETWORK_PAGE,
  REMOVE_NETWORK_PAGE,
  UPDATE_NETWORK_PAGE,
} from "../../constants/routes";

interface NetworkItemProps {
  network: SerializedNetwork;
  style?: CSSProperties;
  showBorderTop?: boolean;
  onClickUpdate?: (network: SerializedNetwork) => void;
  onClickRemove?: (network: SerializedNetwork) => void;
}

const NetworkItem: React.FC<NetworkItemProps> = ({
  network,
  onClickUpdate,
  onClickRemove,
  style,
  showBorderTop,
}) => {
  return (
    <Stack
      direction={"row"}
      style={style}
      paddingY={"8px"}
      boxSizing={"border-box"}
      borderTop={showBorderTop ? "1px solid lightgray" : undefined}
    >
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

  const [defaultNetworks, customNetworks] = useMemo(() => {
    const groupedNetworks = groupBy(networks, "isDefault");
    return [groupedNetworks["true"], groupedNetworks["false"] || []];
  }, [networks]);

  const content = useMemo(() => {
    return (
      <Stack
        height={1}
        boxSizing={"border-box"}
        paddingBottom={"20px"}
        marginTop={1}
      >
        <Box marginRight={"-10px"} paddingRight={"10px"}>
          <Divider
            textAlign={"left"}
            sx={{
              marginTop: "5px",
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
          <Stack>
            {defaultNetworks.map((network, index) => (
              <NetworkItem
                network={network}
                key={network.id}
                showBorderTop={index !== 0}
              />
            ))}
          </Stack>
          {customNetworks.length ? (
            <>
              <Divider
                textAlign={"left"}
                sx={{
                  marginY: "5px",
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
              <Stack
                divider={<Divider sx={{ marginY: "5px" }} />}
                overflow={"auto"}
              >
                <FixedSizeList
                  width={"100%"}
                  itemCount={customNetworks.length}
                  itemSize={75}
                  height={225}
                  itemData={customNetworks}
                >
                  {({ index, style, data }) => {
                    const network = data[index];

                    return (
                      <NetworkItem
                        network={network}
                        key={network.id}
                        style={style}
                        onClickUpdate={onClickUpdate}
                        onClickRemove={onClickRemove}
                        showBorderTop={index !== 0}
                      />
                    );
                  }}
                </FixedSizeList>
              </Stack>
            </>
          ) : null}
        </Box>
      </Stack>
    );
  }, [networks, isLoading, onClickRemove, onClickUpdate, onClickAdd]);

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
