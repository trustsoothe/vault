import React, { useCallback, useEffect, useState } from "react";
import Grow from "@mui/material/Grow";
import Stack from "@mui/material/Stack";
import { useTheme } from "@mui/material";
import Popper from "@mui/material/Popper";
import Button from "@mui/material/Button";
import { shallowEqual } from "react-redux";
import Tooltip from "@mui/material/Tooltip";
import Divider from "@mui/material/Divider";
import Skeleton from "@mui/material/Skeleton";
import { useNavigate } from "react-router-dom";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import { ClickAwayListener } from "@mui/base/ClickAwayListener";
import {
  SerializedAccountReference,
  SupportedProtocols,
} from "@poktscan/keyring";
import NotConnectedIcon from "../../assets/img/not_connected_icon.svg";
import MoreIcon from "../../assets/img/horizontal_more_icon.svg";
import ConnectedIcon from "../../assets/img/connected_icon.svg";
import TransferIcon from "../../assets/img/transfer_icon.svg";
import ExploreIcon from "../../assets/img/explore_icon.svg";
import CopyIcon from "../../assets/img/thin_copy_icon.svg";
import KeyIcon from "../../assets/img/key_icon.svg";
import { roundAndSeparate } from "../../utils/ui";
import {
  ACCOUNT_PK_PAGE,
  CREATE_ACCOUNT_PAGE,
  IMPORT_ACCOUNT_PAGE,
  REIMPORT_SEARCH_PARAM,
  TRANSFER_PAGE,
} from "../../constants/routes";
import RenameModal from "./RenameModal";
import useIsPopup from "../../hooks/useIsPopup";
import CoinSvg from "../../assets/img/coin.svg";
import { useAppDispatch, useAppSelector } from "../../hooks/redux";
import { changeSelectedAccountOfNetwork } from "../../redux/slices/app";
import AppToBackground from "../../controllers/communication/AppToBackground";
import PocketIcon from "../../assets/img/networks/pocket.svg";
import EthereumIcon from "../../assets/img/networks/ethereum.svg";
import RemoveModal from "./RemoveModal";
import useGetPrices from "../../hooks/useGetPrices";

interface AccountComponentProps {
  account: SerializedAccountReference;
  compact?: boolean;
}

export const AccountComponent: React.FC<AccountComponentProps> = ({
  account,
  compact = false,
}) => {
  const theme = useTheme();
  const isPopup = useIsPopup();
  const [showCopyTooltip, setShowCopyTooltip] = useState(false);
  // todo: create selectors file?
  const tabHasConnection = useAppSelector((state) => {
    const sessionsOfTab = state.vault.entities.sessions.list.filter(
      (item) =>
        !!item.origin && !!state.app.activeTab?.url?.startsWith(item.origin)
    );
    return !!sessionsOfTab.length;
  });
  const accountConnectedWithTab = useAppSelector((state) => {
    const selectedNetwork = state.app.selectedNetwork;
    const selectedAccount = state.app.selectedAccountByNetwork[selectedNetwork];

    const sessionsOfTab = state.vault.entities.sessions.list.filter(
      (item) =>
        !!item.origin && !!state.app.activeTab?.url?.startsWith(item.origin)
    );

    let accountConnected = false;

    for (const session of sessionsOfTab) {
      accountConnected = session.permissions.some(
        (permission) =>
          permission.resource === "account" &&
          permission.action === "read" &&
          (permission.identities.includes(selectedAccount) ||
            permission.identities.includes("*"))
      );

      if (accountConnected) {
        break;
      }
    }
    return accountConnected;
  });
  const balanceMap = useAppSelector((state) => {
    const selectedNetwork = state.app.selectedNetwork;
    const selectedChain = state.app.selectedChainByNetwork[selectedNetwork];

    return state.app.accountBalances[selectedNetwork][selectedChain];
  });
  const selectedNetwork = useAppSelector((state) => state.app.selectedNetwork);
  const selectedChain = useAppSelector((state) => {
    const selectedNetwork = state.app.selectedNetwork;
    return state.app.selectedChainByNetwork[selectedNetwork];
  });
  const symbol = useAppSelector((state) => {
    const selectedNetwork = state.app.selectedNetwork;
    return (
      state.vault.entities.assets.list.find(
        (asset) => asset.protocol === selectedNetwork
      )?.symbol || ""
    );
  });

  const {
    data: pricesByProtocolAndChain,
    isError: errorPrice,
    isLoading,
    refetch: refetchPrices,
    isUninitialized,
  } = useGetPrices({
    pollingInterval: 60000,
  });

  const { address } = account || {};
  const loadingPrice = isLoading || isUninitialized;
  const selectedNetworkPrice: number =
    pricesByProtocolAndChain?.[selectedNetwork]?.[selectedChain] || 0;
  const balance = (balanceMap[address]?.amount as number) || 0;
  const errorBalance = balanceMap[address]?.error || false;
  const loadingBalance = balanceMap[address]?.loading || false;

  const addressFirstCharacters = address?.substring(0, 4);
  const addressLastCharacters = address?.substring(address?.length - 4);

  const getAccountBalance = useCallback(() => {
    if (address) {
      AppToBackground.getAccountBalance({
        address: address,
        chainId: selectedChain as any,
        protocol: selectedNetwork,
      }).catch();
    }
  }, [selectedNetwork, selectedChain, address]);

  useEffect(() => {
    getAccountBalance();
    const interval = setInterval(getAccountBalance, 6e4);

    return () => clearInterval(interval);
  }, [getAccountBalance]);

  const handleCopyAddress = useCallback(() => {
    if (address) {
      navigator.clipboard.writeText(account.address).then(() => {
        setShowCopyTooltip(true);
        setTimeout(() => setShowCopyTooltip(false), 500);
      });
    }
  }, [address]);

  return (
    <Stack
      width={1}
      {...(compact && {
        bgcolor: theme.customColors.dark2,
        height: 68,
        boxSizing: "border-box",
        padding: 0.7,
      })}
    >
      {!compact && (
        <Stack
          width={"calc(100% + 10px)"}
          direction={"row"}
          marginLeft={-0.5}
          alignItems={"center"}
          justifyContent={isPopup ? "space-between" : "flex-end"}
        >
          <Tooltip title={"Copied"} open={showCopyTooltip}>
            <Stack
              height={26}
              spacing={0.7}
              minHeight={26}
              paddingX={0.9}
              direction={"row"}
              borderRadius={"12px"}
              alignItems={"center"}
              justifyContent={"center"}
              bgcolor={theme.customColors.dark5}
              onClick={handleCopyAddress}
              sx={{ cursor: "pointer", userSelect: "none" }}
            >
              <Typography
                fontSize={11}
                letterSpacing={"0.5px"}
                color={theme.customColors.dark75}
                lineHeight={"24px"}
              >
                {addressFirstCharacters}...{addressLastCharacters}
              </Typography>
              <CopyIcon />
            </Stack>
          </Tooltip>
          {isPopup && (
            <Stack direction={"row"} spacing={0.8}>
              <Typography
                color={
                  tabHasConnection && accountConnectedWithTab
                    ? theme.customColors.dark100
                    : theme.customColors.dark75
                }
                fontSize={11}
                letterSpacing={"0.5px"}
                fontWeight={500}
                lineHeight={"26px"}
                sx={{ userSelect: "none" }}
              >
                {tabHasConnection && accountConnectedWithTab
                  ? "Connected"
                  : "Not connected"}
              </Typography>
              {tabHasConnection && accountConnectedWithTab ? (
                <ConnectedIcon />
              ) : (
                <NotConnectedIcon />
              )}
            </Stack>
          )}
        </Stack>
      )}
      <Stack
        marginTop={1.5}
        paddingLeft={2}
        paddingRight={2.5}
        alignItems={"flex-end"}
        {...(compact && {
          marginTop: 0,
          paddingLeft: 0,
          paddingRight: 0,
        })}
      >
        <Stack
          width={1}
          height={60}
          paddingY={0.5}
          alignItems={"flex-end"}
          boxSizing={"border-box"}
          justifyContent={"center"}
          borderBottom={`1px solid ${theme.customColors.dark15}`}
          {...(compact && {
            height: 30,
            borderBottom: "none",
            direction: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingY: 0,
          })}
        >
          {compact && (
            <Stack direction={"row"} alignItems={"center"} spacing={0.7}>
              {selectedNetwork === SupportedProtocols.Pocket ? (
                <PocketIcon />
              ) : (
                <EthereumIcon />
              )}
              <Typography
                fontSize={16}
                fontWeight={500}
                letterSpacing={"0.5px"}
                whiteSpace={"nowrap"}
                textOverflow={"ellipsis"}
                overflow={"hidden"}
              >
                {account.name}
              </Typography>
            </Stack>
          )}
          {errorBalance ? (
            <Typography fontSize={16} lineHeight={"50px"}>
              Error getting balance.
              <Button
                sx={{
                  minWidth: 0,
                  paddingX: 1,
                  marginRight: -1,
                  fontSize: 16,
                  color: theme.customColors.primary500,
                  textDecoration: "underline",
                  "&:hover": {
                    textDecoration: "underline",
                  },
                }}
                variant={"text"}
                onClick={getAccountBalance}
              >
                Retry
              </Button>
            </Typography>
          ) : loadingBalance ? (
            <Skeleton variant={"rectangular"} width={200} height={50} />
          ) : (
            <Typography
              fontSize={compact ? 18 : 32}
              fontWeight={500}
              textAlign={"left"}
            >
              {roundAndSeparate(balance, 2, "0")}{" "}
              <span
                style={
                  compact
                    ? {}
                    : { color: theme.customColors.dark25, marginLeft: 5 }
                }
              >
                {symbol}
              </span>
            </Typography>
          )}
        </Stack>
        <Stack
          width={1}
          direction={"row"}
          alignItems={"center"}
          justifyContent={compact ? "space-between" : "flex-end"}
        >
          {compact && (
            <Stack
              height={24}
              spacing={0.7}
              minHeight={24}
              direction={"row"}
              alignItems={"center"}
              justifyContent={"center"}
              sx={{ cursor: "pointer", userSelect: "none" }}
            >
              <Typography
                fontSize={12}
                letterSpacing={"0.5px"}
                color={theme.customColors.dark75}
                lineHeight={"24px"}
              >
                {addressFirstCharacters}...{addressLastCharacters}
              </Typography>
              <Tooltip title={"Copied"} open={showCopyTooltip}>
                <IconButton onClick={handleCopyAddress}>
                  <CopyIcon />
                </IconButton>
              </Tooltip>
            </Stack>
          )}
          {loadingPrice || loadingBalance ? (
            <Skeleton
              variant={"rectangular"}
              width={100}
              height={20}
              sx={{ marginY: 0.5 }}
            />
          ) : errorPrice ? (
            <Typography fontSize={13} lineHeight={"30px"}>
              Error getting USD price.
              <Button
                sx={{
                  minWidth: 0,
                  paddingY: 0,
                  paddingX: 1,
                  marginRight: -1,
                  fontSize: 13,
                  color: theme.customColors.primary500,
                  textDecoration: "underline",
                  "&:hover": {
                    textDecoration: "underline",
                  },
                }}
                variant={"text"}
                onClick={refetchPrices}
              >
                Retry
              </Button>
            </Typography>
          ) : (
            <Typography
              color={theme.customColors.dark75}
              fontSize={compact ? 12 : 14}
              fontWeight={compact ? 400 : 500}
              lineHeight={compact ? "24px" : "30px"}
            >
              ${roundAndSeparate(balance * selectedNetworkPrice, 2, "0")} USD
            </Typography>
          )}
        </Stack>
      </Stack>
    </Stack>
  );
};

interface ButtonActionProps {
  label: string;
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
  onClick?: (event?: React.MouseEvent) => void;
  addHoverStyle?: boolean;
  pathIsStroke?: boolean;
}

const ButtonAction: React.FC<ButtonActionProps> = ({
  label,
  icon: Icon,
  onClick,
  addHoverStyle = true,
  pathIsStroke = false,
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
  const [modalToShow, setModalToShow] = useState<"none" | "rename" | "remove">(
    "none"
  );
  const [anchorEl, setAnchorEl] = useState<HTMLDivElement | null>(null);
  const accounts = useAppSelector(
    (state) => state.vault.entities.accounts.list
  );
  const selectedNetwork = useAppSelector((state) => state.app.selectedNetwork);
  const selectedChain = useAppSelector((state) => {
    const selectedNetwork = state.app.selectedNetwork;
    return state.app.selectedChainByNetwork[selectedNetwork];
  });

  const selectedAccount = useAppSelector((state) => {
    const selectedNetwork = state.app.selectedNetwork;
    const selectedAccountId =
      state.app.selectedAccountByNetwork[selectedNetwork];

    return state.vault.entities.accounts.list.find(
      (account) => account.id === selectedAccountId
    );
  }, shallowEqual);

  useEffect(() => {
    if (!selectedAccount) {
      const accountOfNetwork = accounts.find(
        (item) => item.protocol === selectedNetwork
      );
      if (accountOfNetwork) {
        dispatch(
          changeSelectedAccountOfNetwork({
            network: selectedNetwork,
            accountId: accountOfNetwork.id,
          })
        );
      }
    }

    setModalToShow("none");
  }, [selectedAccount]);

  const getAccountBalance = useCallback(() => {
    if (selectedAccount?.address) {
      AppToBackground.getAccountBalance({
        address: selectedAccount.address,
        chainId: selectedChain as any,
        protocol: selectedNetwork,
      }).catch();
    }
  }, [selectedNetwork, selectedChain, selectedAccount?.address]);

  useEffect(() => {
    getAccountBalance();
    const interval = setInterval(getAccountBalance, 6e4);

    return () => clearInterval(interval);
  }, [getAccountBalance]);

  const showRenameModal = useCallback(() => setModalToShow("rename"), []);
  const showRemoveModal = useCallback(() => setModalToShow("remove"), []);
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
        `${TRANSFER_PAGE}?fromAddress=${selectedAccount.address}&protocol=${selectedNetwork}&chainID=${selectedChain}`
      );
    }
  }, [navigate, selectedAccount, selectedChain, selectedNetwork]);

  const onClickPk = useCallback(() => {
    if (selectedAccount) {
      navigate(`${ACCOUNT_PK_PAGE}?id=${selectedAccount.id}`);
    }
  }, [navigate, selectedAccount]);

  const onClickReimport = useCallback(() => {
    if (selectedAccount) {
      navigate(`${IMPORT_ACCOUNT_PAGE}${REIMPORT_SEARCH_PARAM}`);
    }
  }, [selectedAccount, navigate]);

  const onClickExplorer = useCallback(() => {
    let link: string;
    if (selectedAccount) {
      if (selectedNetwork === SupportedProtocols.Pocket) {
        link = `https://poktscan.com${
          selectedChain === "testnet" ? "/testnet" : ""
        }/account/${selectedAccount.address}`;
      }
    }

    if (link) {
      window.open(link, "_blank");
    }
  }, [selectedAccount, selectedChain, selectedNetwork]);

  const onClickImport = useCallback(() => {
    navigate(IMPORT_ACCOUNT_PAGE);
  }, [navigate]);

  const onClickNew = useCallback(() => {
    navigate(CREATE_ACCOUNT_PAGE);
  }, [navigate]);

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
            You do not have any account yet.
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
              onClick: onClickNew,
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

  return (
    <>
      <Stack paddingTop={1}>
        {selectedAccount && <AccountComponent account={selectedAccount} />}
        <Stack direction={"row"} spacing={4} marginTop={1.5}>
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
          <ButtonAction
            label={"Private Key"}
            icon={KeyIcon}
            onClick={onClickPk}
          />
          <ButtonAction
            label={"More"}
            icon={MoreIcon}
            onClick={onOpenMoreMenu}
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
                    height={148}
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
                    {[
                      { label: "Private Key", onClick: onClickPk },
                      { label: "Reimport Account", onClick: onClickReimport },
                      {
                        label: "Rename Account",
                        onClick: showRenameModal,
                      },
                      {
                        type: "divider",
                      },
                      {
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
                      },
                    ].map(({ type, label, onClick, customProps }) => {
                      if (type === "divider") {
                        return (
                          <Divider
                            sx={{
                              marginY: 0.7,
                              borderColor: theme.customColors.dark15,
                            }}
                          />
                        );
                      } else {
                        return (
                          <Typography
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
                                backgroundColor: theme.customColors.primary500,
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
                    })}
                  </Stack>
                </Grow>
              </ClickAwayListener>
            )}
          </Popper>
        </Stack>
      </Stack>

      <RenameModal
        account={modalToShow === "rename" ? selectedAccount : null}
        onClose={closeModel}
      />
      <RemoveModal
        onClose={closeModel}
        account={modalToShow === "remove" ? selectedAccount : null}
      />
    </>
  );
};

export default SelectedAccount;
