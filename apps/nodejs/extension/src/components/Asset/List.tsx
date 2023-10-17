import type { SerializedAsset } from "@poktscan/keyring";
import { connect } from "react-redux";
import Stack from "@mui/material/Stack";
import { useTheme } from "@mui/material";
import React, { useMemo } from "react";
import Typography from "@mui/material/Typography";
import { RootState } from "../../redux/store";
import RowSpaceBetween from "../common/RowSpaceBetween";
import { labelByChainID, labelByProtocolMap } from "../../constants/protocols";

interface AssetItemProps {
  asset: SerializedAsset;
}

const AssetItem: React.FC<AssetItemProps> = ({ asset }) => {
  const theme = useTheme();
  return (
    <Stack
      height={90}
      paddingX={1}
      paddingTop={0.5}
      paddingBottom={1}
      borderRadius={"4px"}
      boxSizing={"border-box"}
      bgcolor={theme.customColors.dark2}
      border={`1px solid ${theme.customColors.dark15}`}
    >
      <Typography
        fontSize={14}
        letterSpacing={"0.5px"}
        fontWeight={500}
        lineHeight={"30px"}
      >
        {asset.name} ({asset.symbol})
      </Typography>
      <RowSpaceBetween
        label={"Protocol"}
        value={labelByProtocolMap[asset.protocol.name] || asset.protocol.name}
      />
      <RowSpaceBetween
        label={"Protocol"}
        value={labelByChainID[asset.protocol.chainID] || asset.protocol.chainID}
      />
    </Stack>
  );
};

interface AssetListProps {
  assets: SerializedAsset[];
}

const AssetList: React.FC<AssetListProps> = ({ assets }) => {
  const list = useMemo(() => {
    return assets.map((asset) => <AssetItem asset={asset} key={asset.id} />);
  }, [assets]);

  return (
    <Stack flexGrow={1} height={1} marginTop={2} spacing={1.5}>
      {list}
    </Stack>
  );
};

const mapStateToProps = (state: RootState) => {
  return {
    assets: state.vault.entities.assets.list,
  };
};

export default connect(mapStateToProps)(AssetList);
