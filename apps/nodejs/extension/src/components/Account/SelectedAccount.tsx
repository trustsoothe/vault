import type { OutletContext } from "../../types";
import type { AssetLocationState } from "../Transfer";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import Grow from "@mui/material/Grow";
import Stack from "@mui/material/Stack";
import Popper from "@mui/material/Popper";
import Button from "@mui/material/Button";
import { shallowEqual } from "react-redux";
import Divider from "@mui/material/Divider";
import {
  useNavigate,
  useOutletContext,
  useSearchParams,
} from "react-router-dom";
import Typography from "@mui/material/Typography";
import { type SxProps, useTheme } from "@mui/material";
import { ClickAwayListener } from "@mui/base/ClickAwayListener";
import { SupportedProtocols } from "@poktscan/keyring";
import MoreIcon from "../../assets/img/account_more_icon.svg";
import TransferIcon from "../../assets/img/transfer_icon.svg";
import ExploreIcon from "../../assets/img/explore_icon.svg";
import WPoktIcon from "../../assets/img/wpokt_icon.svg";
import {
  ACCOUNT_PK_PAGE,
  IMPORT_ACCOUNT_PAGE,
  TRANSFER_PAGE,
} from "../../constants/routes";
import RenameModal from "./RenameModal";
import CoinSvg from "../../assets/img/coin.svg";
import { useAppDispatch, useAppSelector } from "../../hooks/redux";
import { changeSelectedAccountOfNetwork, IAsset } from "../../redux/slices/app";
import RemoveModal from "./RemoveModal";
import EditAssetsSelectionModal from "../Asset/EditAssetsSelectionModal";
import WrappedPoktTxs from "./WrappedPoktTxs";
import AccountInfo from "./AccountInfo";
import AssetList from "./AssetList";
import {
  explorerAccountUrlSelector,
  selectedChainSelector,
  selectedProtocolSelector,
} from "../../redux/selectors/network";
import {
  accountsSelector,
  selectedAccountSelector,
} from "../../redux/selectors/account";
import {
  assetsIdOfSelectedAccountSelector,
  assetsSelector,
  existsAssetsForSelectedNetworkSelector,
} from "../../redux/selectors/asset";
import useDidMountEffect from "../../hooks/useDidMountEffect";

interface ButtonActionProps {
  label: string;
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
  onClick?: (event?: React.MouseEvent) => void;
  addHoverStyle?: boolean;
  pathIsStroke?: boolean;
  customSvgHoverSxProps?: SxProps;
}

const ButtonAction: React.FC<ButtonActionProps> = ({
  label,
  icon: Icon,
  onClick,
  addHoverStyle = true,
  pathIsStroke = false,
  customSvgHoverSxProps,
}) => {
  const theme = useTheme();
  return (
    <Stack
      width={60}
      minWidth={60}
      maxWidth={60}
      height={70}
      paddingY={0.4}
      spacing={0.6}
      onClick={onClick}
      alignItems={"center"}
      sx={{
        cursor: "pointer",
        userSelect: "none",
        ...(addHoverStyle && {
          "&:hover": {
            "& rect": {
              fill: theme.customColors.primary500,
            },
            "& path": {
              [pathIsStroke ? "stroke" : "fill"]: theme.customColors.white,
            },
            "& path.key_icon_svg__not-fill": {
              [pathIsStroke ? "stroke" : "fill"]:
                theme.customColors.primary999 + "!important",
            },
            ...customSvgHoverSxProps,
          },
        }),
      }}
    >
      <Icon />
      <Typography
        fontSize={"10px!important"}
        height={16}
        lineHeight={"16px"}
        color={theme.customColors.dark75}
        letterSpacing={"0.5px"}
      >
        {label}
      </Typography>
    </Stack>
  );
};

const SelectedAccount: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { toggleShowCreateAccount } = useOutletContext<OutletContext>();
  const [searchParams, setURLSearchParams] = useSearchParams();
  const [modalToShow, setModalToShow] = useState<
    "none" | "rename" | "remove" | "assets"
  >("none");
  const [selectedAsset, setSelectedAsset] = useState<IAsset | null>(null);
  const [anchorEl, setAnchorEl] = useState<HTMLDivElement | null>(null);
  const [wPoktVisible, setWPoktVisible] = useState(false);

  const accounts = useAppSelector(accountsSelector);
  const selectedChain = useAppSelector(selectedChainSelector);
  const selectedProtocol = useAppSelector(selectedProtocolSelector);
  const selectedAccount = useAppSelector(selectedAccountSelector, shallowEqual);
  const explorerAccountUrl = useAppSelector(
    explorerAccountUrlSelector(!!selectedAsset)
  );

  const existsAssetsForSelectedNetwork = useAppSelector(
    existsAssetsForSelectedNetworkSelector
  );
  const assetsIdOfAccount = useAppSelector(assetsIdOfSelectedAccountSelector);
  const assets = useAppSelector(assetsSelector);

  const assetsOfAccount = useMemo(() => {
    return assets.filter(
      (asset) =>
        (assetsIdOfAccount || []).includes(asset.id) &&
        asset.protocol === selectedProtocol &&
        asset.chainId === selectedChain
    );
  }, [assets, assetsIdOfAccount, selectedProtocol, selectedChain]);

  useEffect(() => {
    if (!selectedAccount) {
      const accountOfNetwork = accounts.find(
        (item) => item.protocol === selectedProtocol
      );
      if (accountOfNetwork) {
        dispatch(
          changeSelectedAccountOfNetwork({
            protocol: selectedProtocol,
            address: accountOfNetwork.address,
          })
        );
      }
    }

    if (
      !(
        selectedAccount &&
        selectedAsset &&
        selectedProtocol === SupportedProtocols.Ethereum &&
        assetsIdOfAccount?.includes(selectedAsset.id)
      )
    ) {
      if (selectedAsset) {
        setURLSearchParams({});
      }
      setSelectedAsset(null);
    }

    setModalToShow("none");
    setWPoktVisible(false);
  }, [selectedAccount]);

  useEffect(() => {
    if (selectedAsset?.symbol !== "wPOKT") {
      setWPoktVisible(false);
    }
  }, [selectedAsset]);

  useEffect(() => {
    const assetId = searchParams.get("asset");

    const asset = assetsOfAccount.find(
      (asset) =>
        asset.id === assetId &&
        asset.protocol === selectedProtocol &&
        asset.chainId === selectedChain
    );

    if (asset) {
      setSelectedAsset(asset);
    }
  }, []);

  useDidMountEffect(() => {
    if (selectedAsset) {
      if (!assetsOfAccount.some((asset) => asset.id === selectedAsset.id)) {
        setSelectedAsset(null);
      }
    }
  }, [assetsOfAccount?.length]);

  useEffect(() => {
    if (selectedAsset) {
      setSelectedAsset(null);
      setURLSearchParams({});
    }
    setModalToShow("none");
    setWPoktVisible(false);
  }, [selectedProtocol, selectedChain]);

  const showRenameModal = useCallback(() => setModalToShow("rename"), []);
  const showRemoveModal = useCallback(() => setModalToShow("remove"), []);
  const showAssetsModal = useCallback(() => setModalToShow("assets"), []);
  const closeModel = useCallback(() => setModalToShow("none"), []);

  const onOpenMoreMenu = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      setAnchorEl(event.currentTarget);
    },
    []
  );

  const onCloseMoreMenu = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const onClickTransfer = useCallback(() => {
    if (selectedAccount) {
      navigate(
        TRANSFER_PAGE,
        selectedAsset
          ? { state: { asset: selectedAsset } as AssetLocationState }
          : undefined
      );
    }
  }, [
    navigate,
    selectedAccount,
    selectedChain,
    selectedProtocol,
    selectedAsset,
  ]);

  const onClickPk = useCallback(() => {
    if (selectedAccount) {
      navigate(`${ACCOUNT_PK_PAGE}?id=${selectedAccount.id}`);
    }
  }, [navigate, selectedAccount]);

  const onClickExplorer = useCallback(() => {
    if (explorerAccountUrl && selectedAccount?.address) {
      let link = explorerAccountUrl.replace(
        ":address",
        selectedAccount.address
      );

      if (selectedAsset) {
        link = link.replace(":contractAddress", selectedAsset.contractAddress);
      }
      window.open(link, "_blank");
    }
  }, [selectedAccount?.address, explorerAccountUrl, selectedAsset]);

  const onClickImport = useCallback(() => {
    navigate(IMPORT_ACCOUNT_PAGE);
  }, [navigate]);

  const toggleWPoktVisible = useCallback(
    () => setWPoktVisible((prevState) => !prevState),
    []
  );

  const onClickAsset = useCallback(
    (asset: IAsset) => {
      setSelectedAsset(asset);
      setURLSearchParams({ asset: asset.id });
    },
    [setURLSearchParams]
  );
  const onGoBackFromAsset = useCallback(() => {
    setSelectedAsset(null);
    setURLSearchParams({});
  }, []);

  const wrappedPoktComponent = useMemo(() => {
    if (
      selectedProtocol === SupportedProtocols.Ethereum &&
      selectedAsset?.symbol === "wPOKT"
    ) {
      return (
        <WrappedPoktTxs
          action={"mints"}
          address={selectedAccount?.address}
          showForm={wPoktVisible}
          onCloseForm={toggleWPoktVisible}
        />
      );
    } else if (selectedProtocol === SupportedProtocols.Pocket && wPoktVisible) {
      return (
        <WrappedPoktTxs
          action={"burns"}
          address={selectedAccount?.address}
          onCloseForm={toggleWPoktVisible}
        />
      );
    }
  }, [
    wPoktVisible,
    selectedProtocol,
    selectedAsset?.symbol,
    selectedAccount?.address,
    toggleWPoktVisible,
  ]);

  const assetsComponent = useMemo(() => {
    if (
      selectedProtocol !== SupportedProtocols.Ethereum ||
      !!selectedAsset ||
      !existsAssetsForSelectedNetwork
    ) {
      return null;
    }

    return (
      <AssetList
        assets={assetsOfAccount}
        onClickAsset={onClickAsset}
        onClickAction={showAssetsModal}
        actionText={!assetsOfAccount.length ? "Add Asset" : "Edit Assets"}
      />
    );
  }, [
    selectedAsset,
    assetsIdOfAccount,
    selectedProtocol,
    selectedChain,
    assetsOfAccount,
    onClickAsset,
    onGoBackFromAsset,
    existsAssetsForSelectedNetwork,
  ]);

  if (!selectedAccount) {
    return (
      <Stack flexGrow={1}>
        <Stack flexGrow={1} alignItems={"center"} paddingTop={7}>
          <CoinSvg />
          <Typography
            color={theme.customColors.primary999}
            fontSize={14}
            lineHeight={"20px"}
            textAlign={"center"}
          >
            You do not have any accounts yet.
            <br />
            Please create new or import an account.
          </Typography>
        </Stack>
        <Stack direction={"row"} height={36} spacing={2}>
          {[
            {
              label: "Import",
              onClick: onClickImport,
            },
            {
              label: "New",
              onClick: toggleShowCreateAccount,
            },
          ].map(({ label, onClick }, index) => (
            <Button
              key={index}
              variant={"contained"}
              fullWidth
              sx={{
                backgroundColor: theme.customColors.primary500,
                fontSize: 16,
                fontWeight: 700,
              }}
              onClick={onClick}
            >
              {label}
            </Button>
          ))}
        </Stack>
      </Stack>
    );
  }

  const isPokt = selectedProtocol === SupportedProtocols.Pocket;

  const menuItems = [];

  if (selectedAsset) {
    menuItems.push({
      key: "remove_asset_item",
      label: "Remove Asset",
      onClick: showAssetsModal,
      customProps: {
        color: theme.customColors.red100,
        sx: {
          "&:hover": {
            color: theme.customColors.white,
            backgroundColor: theme.customColors.red100,
            fontWeight: 700,
          },
        },
      },
    });
  } else {
    menuItems.push(
      {
        key: "private_key_item",
        label: "Private Key",
        onClick: onClickPk,
      },
      {
        key: "rename_item",
        label: "Rename Account",
        onClick: showRenameModal,
      },
      {
        key: "divider1_item",
        type: "divider",
      },
      {
        key: "remove_item",
        label: "Remove Account",
        onClick: showRemoveModal,
        customProps: {
          color: theme.customColors.red100,
          sx: {
            "&:hover": {
              color: theme.customColors.white,
              backgroundColor: theme.customColors.red100,
              fontWeight: 700,
            },
          },
        },
      }
    );
  }

  return (
    <>
      <Stack paddingTop={1}>
        {selectedAccount && (
          <AccountInfo
            account={selectedAccount}
            asset={selectedAsset}
            onGoBackFromAsset={onGoBackFromAsset}
            {...(wPoktVisible &&
              isPokt && {
                onGoBack: toggleWPoktVisible,
                backLabel: `${selectedAccount.name} / POKT`,
                asset: null,
                onGoBackFromAsset: undefined,
              })}
          />
        )}
        {!wPoktVisible && (
          <Stack
            direction={"row"}
            justifyContent={"space-between"}
            marginTop={1.5}
          >
            <ButtonAction
              label={"Transfer"}
              pathIsStroke={true}
              icon={TransferIcon}
              onClick={onClickTransfer}
            />
            <ButtonAction
              label={"Explore"}
              icon={ExploreIcon}
              onClick={onClickExplorer}
            />
            {(selectedProtocol === SupportedProtocols.Pocket ||
              selectedAsset?.symbol === "wPOKT") && (
              <ButtonAction
                label={
                  selectedProtocol === SupportedProtocols.Ethereum
                    ? "Unwrap"
                    : "wPOKT"
                }
                icon={WPoktIcon}
                pathIsStroke={true}
                onClick={toggleWPoktVisible}
                customSvgHoverSxProps={{
                  "& path": {
                    stroke: theme.customColors.white,
                    "&[fill]": {
                      fill: theme.customColors.white,
                    },
                  },
                }}
              />
            )}
            <ButtonAction
              label={"More"}
              icon={MoreIcon}
              onClick={onOpenMoreMenu}
              customSvgHoverSxProps={{
                "& circle": {
                  fill: theme.customColors.white,
                },
              }}
            />
            <Popper
              transition
              open={!!anchorEl}
              anchorEl={anchorEl}
              placement={"bottom-end"}
            >
              {({ TransitionProps }) => (
                <ClickAwayListener onClickAway={onCloseMoreMenu}>
                  <Grow {...TransitionProps}>
                    <Stack
                      width={140}
                      height={selectedAsset ? 41 : 120}
                      padding={0.5}
                      borderRadius={"8px"}
                      boxSizing={"border-box"}
                      bgcolor={theme.customColors.white}
                      border={`1px solid ${theme.customColors.dark15}`}
                      sx={{
                        top: -42,
                        left: -166,
                        position: "absolute",
                        boxShadow: "0px 0px 6px 0px #1C2D4A26",
                        borderTopRightRadius: "0px!important",
                      }}
                    >
                      {menuItems.map(
                        ({ type, label, onClick, customProps, key }) => {
                          if (type === "divider") {
                            return (
                              <Divider
                                key={key}
                                sx={{
                                  marginY: 0.7,
                                  borderColor: theme.customColors.dark15,
                                }}
                              />
                            );
                          } else {
                            return (
                              <Typography
                                key={key}
                                width={1}
                                height={30}
                                fontSize={11}
                                paddingX={0.5}
                                lineHeight={"30px"}
                                letterSpacing={"0.5px"}
                                boxSizing={"border-box"}
                                {...customProps}
                                onClick={() => {
                                  if (onClick) {
                                    onClick();
                                  }
                                  onCloseMoreMenu();
                                }}
                                sx={{
                                  cursor: "pointer",
                                  userSelect: "none",
                                  "&:hover": {
                                    backgroundColor:
                                      theme.customColors.primary500,
                                    color: theme.customColors.white,
                                    fontWeight: 700,
                                  },
                                  ...customProps?.sx,
                                }}
                              >
                                {label}
                              </Typography>
                            );
                          }
                        }
                      )}
                    </Stack>
                  </Grow>
                </ClickAwayListener>
              )}
            </Popper>
          </Stack>
        )}
        {assetsComponent}
        {wrappedPoktComponent}
      </Stack>

      <RenameModal
        account={modalToShow === "rename" ? selectedAccount : null}
        onClose={closeModel}
      />
      <RemoveModal
        onClose={closeModel}
        account={modalToShow === "remove" ? selectedAccount : null}
      />
      {selectedProtocol === SupportedProtocols.Ethereum && (
        <EditAssetsSelectionModal
          open={modalToShow === "assets"}
          onClose={closeModel}
        />
      )}
    </>
  );
};

export default SelectedAccount;
