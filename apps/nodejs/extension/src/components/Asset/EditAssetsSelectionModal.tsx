import React, { useCallback, useEffect, useMemo, useState } from "react";
import Fade from "@mui/material/Fade";
import Stack from "@mui/material/Stack";
import { useTheme } from "@mui/material";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { ClickAwayListener } from "@mui/base/ClickAwayListener";
import useDidMountEffect from "../../hooks/useDidMountEffect";
import { useAppDispatch, useAppSelector } from "../../hooks/redux";
import { IAsset, toggleAssetOfAccount } from "../../redux/slices/app";

interface AssetItemProps {
  asset: IAsset;
}

const AssetItem: React.FC<AssetItemProps> = ({ asset }) => {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const selectedAccountId = useAppSelector(
    (state) => state.app.selectedAccountByNetwork[state.app.selectedNetwork]
  );
  const assetAlreadyIncluded = useAppSelector((state) =>
    state.app.assetsIdByAccountId[selectedAccountId]?.includes(asset?.id)
  );

  const toggleAssetIncluded = useCallback(() => {
    if (asset && selectedAccountId) {
      dispatch(
        toggleAssetOfAccount({
          assetId: asset.id,
          accountId: selectedAccountId,
        })
      );
    }
  }, [dispatch, asset, selectedAccountId]);

  return (
    <Stack
      height={30}
      paddingX={1}
      borderRadius={"4px"}
      boxSizing={"border-box"}
      bgcolor={theme.customColors.dark2}
      border={`1px solid ${theme.customColors.dark15}`}
      direction={"row"}
      alignItems={"center"}
      width={1}
      justifyContent={"space-between"}
      paddingY={0.5}
    >
      <Stack direction={"row"} alignItems={"center"} spacing={0.5}>
        <img
          src={asset.iconUrl}
          alt={`${asset.protocol}-${asset.chainId}-img`}
          width={20}
          height={20}
        />
        <Typography
          fontSize={14}
          fontWeight={500}
          letterSpacing={"0.5px"}
          lineHeight={"30px"}
        >
          {asset.label || asset.symbol}
        </Typography>
      </Stack>
      <Button
        sx={{
          fontSize: 12,
          paddingX: 0.4,
          paddingY: 0,
          height: 20,
          minWidth: 0,
        }}
        variant={"text"}
        onClick={toggleAssetIncluded}
      >
        {assetAlreadyIncluded ? "Remove" : "Add"}
      </Button>
    </Stack>
  );
};

interface EditAssetsSelectionModalProps {
  open: boolean;
  onClose: () => void;
}

const EditAssetsSelectionModal: React.FC<EditAssetsSelectionModalProps> = ({
  onClose,
  open,
}) => {
  const theme = useTheme();
  const [stillShowModal, setStillShowModal] = useState(false);
  const selectedProtocol = useAppSelector((state) => state.app.selectedNetwork);
  const selectedChain = useAppSelector(
    (state) => state.app.selectedChainByNetwork[selectedProtocol]
  );
  const selectedAccountId = useAppSelector(
    (state) => state.app.selectedAccountByNetwork[selectedProtocol]
  );
  const assets = useAppSelector((state) => state.app.assets);

  const assetsOfNetwork = useMemo(() => {
    return assets.filter(
      (asset) =>
        asset.protocol === selectedProtocol && asset.chainId === selectedChain
    );
  }, [assets, selectedProtocol, selectedChain]);

  useDidMountEffect(() => {
    onClose();
  }, [selectedAccountId]);

  const onClickAway = useCallback(() => {
    if (stillShowModal) {
      onClose();
    }
  }, [onClose, stillShowModal]);

  useEffect(() => {
    if (open) {
      setTimeout(() => setStillShowModal(true), 100);
    } else {
      setTimeout(() => setStillShowModal(false), 225);
    }
  }, [open]);

  const content = useMemo(() => {
    if (!stillShowModal) {
      return null;
    }
    const title = (
      <Typography
        fontSize={16}
        fontWeight={700}
        lineHeight={"30px"}
        textAlign={"center"}
        color={theme.customColors.primary999}
      >
        Edit Assets Selection
      </Typography>
    );

    return (
      <ClickAwayListener onClickAway={onClickAway}>
        <Stack
          width={1}
          height={510}
          paddingX={2.5}
          paddingTop={1.5}
          paddingBottom={2}
          borderRadius={"8px"}
          boxSizing={"border-box"}
          justifyContent={"space-between"}
          bgcolor={theme.customColors.white}
          boxShadow={"2px 2px 14px 0px #1C2D4A33"}
          border={`1px solid ${theme.customColors.dark25}`}
        >
          <Stack spacing={1}>
            {title}
            <Stack spacing={1} overflow={"auto"} maxHeight={400}>
              {!assetsOfNetwork.length ? (
                <Stack
                  flexGrow={1}
                  justifyContent={"center"}
                  alignItems={"center"}
                >
                  <Typography
                    fontSize={14}
                    color={theme.customColors.primary250}
                    fontWeight={500}
                    paddingX={5}
                    marginTop={6}
                    textAlign={"center"}
                  >
                    There are not assets available for this network.
                  </Typography>
                </Stack>
              ) : (
                assetsOfNetwork.map((asset) => (
                  <AssetItem key={asset.id} asset={asset} />
                ))
              )}
            </Stack>
          </Stack>

          <Button
            onClick={onClose}
            sx={{
              fontWeight: 500,
              color: theme.customColors.primary500,
              height: 30,
              borderWidth: 1.5,
              fontSize: 14,
            }}
            variant={"text"}
            fullWidth
          >
            Close
          </Button>
        </Stack>
      </ClickAwayListener>
    );
  }, [theme, assetsOfNetwork, onClickAway, stillShowModal]);

  return (
    <Fade in={!!open}>
      <Stack
        width={1}
        height={540}
        padding={1.5}
        position={"absolute"}
        boxSizing={"border-box"}
        zIndex={9}
        top={-60}
        left={0}
        bgcolor={"rgba(255,255,255,0.5)"}
      >
        {content}
      </Stack>
    </Fade>
  );
};

export default EditAssetsSelectionModal;
