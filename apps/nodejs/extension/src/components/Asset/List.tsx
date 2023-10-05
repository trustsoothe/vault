import React, { useCallback, useMemo, useState } from "react";
import { SerializedAsset } from "@poktscan/keyring";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Divider, IconButton } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import Box from "@mui/material/Box";
import AddUpdateAsset from "./AddUpdate";
import RemoveAsset from "./Remove";
import { RootState } from "../../redux/store";
import { connect } from "react-redux";
import { labelByChainID, labelByProtocolMap } from "../../constants/protocols";

interface AssetItemProps {
  asset: SerializedAsset;
  onClickUpdate?: (asset: SerializedAsset) => void;
  onClickRemove?: (asset: SerializedAsset) => void;
}

const AssetItem: React.FC<AssetItemProps> = ({
  asset,
  onClickUpdate,
  onClickRemove,
}) => {
  return (
    <Stack direction={"row"}>
      <Stack paddingX={"5px"} flexGrow={1} spacing={"3px"}>
        <Stack direction={"row"} alignItems={"center"} spacing={"7px"}>
          <Typography fontSize={12} fontWeight={600}>
            {asset.name} ({asset.symbol})
          </Typography>
        </Stack>
        <Stack direction={"row"} alignItems={"center"} spacing={"10px"}>
          <Typography fontSize={12}>
            Protocol: {labelByProtocolMap[asset.protocol.name]}
          </Typography>
          <Typography fontSize={12}>
            ChainID: {labelByChainID[asset.protocol.chainID]}
          </Typography>
        </Stack>
      </Stack>
      <Stack spacing={"10px"} width={"min-content"}>
        {onClickUpdate && (
          <IconButton sx={{ padding: 0 }} onClick={() => onClickUpdate(asset)}>
            <EditIcon sx={{ fontSize: 18 }} />
          </IconButton>
        )}
        {onClickRemove && (
          <IconButton sx={{ padding: 0 }} onClick={() => onClickRemove(asset)}>
            <DeleteIcon sx={{ fontSize: 18 }} />
          </IconButton>
        )}
      </Stack>
    </Stack>
  );
};

interface AssetListProps {
  assets: SerializedAsset[];
  isLoading: boolean;
}

const AssetList: React.FC<AssetListProps> = ({ assets, isLoading }) => {
  const [selectedAsset, setSelectedAsset] = useState<SerializedAsset>(null);
  const [view, setView] = useState<"list" | "addUpdate" | "remove">("list");

  const onClickAdd = useCallback(() => {
    setView("addUpdate");
  }, []);

  const onClickUpdate = useCallback((asset: SerializedAsset) => {
    setSelectedAsset(asset);
    setView("addUpdate");
  }, []);

  const onClickRemove = useCallback((asset: SerializedAsset) => {
    setSelectedAsset(asset);
    setView("remove");
  }, []);

  const onClose = useCallback(() => {
    setSelectedAsset(null);
    setView("list");
  }, []);

  const content = useMemo(() => {
    if (view === "addUpdate") {
      return <AddUpdateAsset onClose={onClose} assetToUpdate={selectedAsset} />;
    }

    if (selectedAsset && view === "remove") {
      return <RemoveAsset asset={selectedAsset} onClose={onClose} />;
    }

    return (
      <Stack
        height={1}
        boxSizing={"border-box"}
        paddingBottom={"20px"}
        marginTop={1}
      >
        <Box
          overflow={"auto"}
          marginRight={"-10px"}
          paddingRight={"10px"}
          marginTop={"10px"}
        >
          <Stack divider={<Divider sx={{ marginY: "10px" }} />}>
            {assets.map((asset) => (
              <AssetItem asset={asset} key={asset.id} />
            ))}
          </Stack>
        </Box>
      </Stack>
    );
  }, [
    selectedAsset,
    onClose,
    assets,
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
    assets: state.vault.entities.assets.list,
    isLoading: state.vault.entities.assets.loading,
  };
};

export default connect(mapStateToProps)(AssetList);
