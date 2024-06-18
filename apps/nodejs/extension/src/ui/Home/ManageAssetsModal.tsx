import React, { useMemo } from "react";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import { useAppDispatch, useAppSelector } from "../../hooks/redux";
import { selectedAccountAddressSelector } from "../../redux/selectors/account";
import { IAsset, toggleAssetOfAccount } from "../../redux/slices/app";
import useDidMountEffect from "../../hooks/useDidMountEffect";
import DialogButtons from "../components/DialogButtons";
import SelectedIcon from "../assets/img/check_icon.svg";
import { enqueueErrorSnackbar } from "../../utils/ui";
import BaseDialog from "../components/BaseDialog";
import { themeColors } from "../theme";
import {
  selectedChainSelector,
  selectedProtocolSelector,
} from "../../redux/selectors/network";
import {
  assetAlreadyIncludedSelector,
  assetsSelector,
} from "../../redux/selectors/asset";

interface AssetItemProps {
  asset: IAsset;
}

function AssetItem({ asset }: AssetItemProps) {
  const dispatch = useAppDispatch();
  const selectedAccountAddress = useAppSelector(selectedAccountAddressSelector);
  const assetAlreadyIncluded = useAppSelector(
    assetAlreadyIncludedSelector(asset)
  );

  const toggleAssetIncluded = () => {
    if (asset && selectedAccountAddress) {
      dispatch(
        toggleAssetOfAccount({
          assetId: asset.id,
          address: selectedAccountAddress,
        })
      )
        .unwrap()
        .catch(() => {
          enqueueErrorSnackbar({
            message: `Failed to ${assetAlreadyIncluded ? "remove" : "add"} ${
              asset.symbol
            } asset`,
            variant: "error",
            onRetry: toggleAssetIncluded,
          });
        });
    }
  };

  return (
    <Button
      sx={{
        height: 55,
        paddingY: 1,
        paddingX: 1.5,
        fontWeight: 400,
        borderRadius: "8px",
        backgroundColor: assetAlreadyIncluded
          ? themeColors.bgLightGray
          : themeColors.white,
      }}
      onClick={toggleAssetIncluded}
    >
      <Stack width={1} spacing={1.2} direction={"row"} alignItems={"center"}>
        <img
          width={23}
          height={23}
          src={asset.iconUrl}
          alt={`${asset.label || asset.symbol}-icon`}
        />
        <Stack
          flexGrow={1}
          minWidth={0}
          alignItems={"flex-start"}
          spacing={0.5}
        >
          <Typography
            variant={"subtitle2"}
            lineHeight={"16px"}
            noWrap={true}
            color={themeColors.black}
          >
            {asset.symbol}
          </Typography>
          <Typography
            lineHeight={"14px"}
            fontSize={11}
            color={themeColors.textSecondary}
          >
            {asset.label || asset.symbol}
          </Typography>
        </Stack>
        {assetAlreadyIncluded && <SelectedIcon />}
      </Stack>
    </Button>
  );
}

interface ManageAssetsModalProps {
  open: boolean;
  onClose: () => void;
}

export default function ManageAssetsModal({
  onClose,
  open,
}: ManageAssetsModalProps) {
  const selectedProtocol = useAppSelector(selectedProtocolSelector);
  const selectedChain = useAppSelector(selectedChainSelector);
  const selectedAccountAddress = useAppSelector(selectedAccountAddressSelector);
  const assets = useAppSelector(assetsSelector);

  const assetsOfNetwork = useMemo(() => {
    return assets.filter(
      (asset) =>
        asset.protocol === selectedProtocol && asset.chainId === selectedChain
    );
  }, [assets, selectedProtocol, selectedChain]);

  useDidMountEffect(() => {
    onClose();
  }, [selectedAccountAddress]);

  return (
    <BaseDialog open={open} onClose={onClose} title={"Manage Assets"}>
      <DialogContent sx={{ paddingY: "16px!important", paddingX: 0.8 }}>
        <Stack spacing={0.2}>
          {assetsOfNetwork.map((asset) => (
            <AssetItem asset={asset} key={asset.id} />
          ))}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ padding: 0, height: 85 }}>
        <DialogButtons
          primaryButtonProps={{
            children: "Done",
            onClick: onClose,
          }}
        />
      </DialogActions>
    </BaseDialog>
  );
}
