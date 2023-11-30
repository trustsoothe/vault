import type { SerializedAccountReference } from "@poktscan/keyring";
import type { IAsset } from "../../redux/slices/app";
import React, { useCallback, useEffect, useState } from "react";
import Stack from "@mui/material/Stack";
import { useTheme } from "@mui/material";
import Button from "@mui/material/Button";
import Tooltip from "@mui/material/Tooltip";
import Skeleton from "@mui/material/Skeleton";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import useIsPopup from "../../hooks/useIsPopup";
import { useAppSelector } from "../../hooks/redux";
import useGetPrices from "../../hooks/useGetPrices";
import TooltipOverflow from "../common/TooltipOverflow";
import CopyIcon from "../../assets/img/thin_copy_icon.svg";
import useGetAssetPrices from "../../hooks/useGetAssetPrices";
import ConnectedIcon from "../../assets/img/connected_icon.svg";
import NotConnectedIcon from "../../assets/img/not_connected_icon.svg";
import AppToBackground from "../../controllers/communication/AppToBackground";
import {
  getTruncatedText,
  returnNumWithTwoDecimals,
  roundAndSeparate,
} from "../../utils/ui";
import {
  accountConnectedWithTabSelector,
  tabHasConnectionSelector,
} from "../../redux/selectors/session";
import { balanceMapConsideringAsset } from "../../redux/selectors/account";
import {
  networkSymbolSelector,
  selectedChainSelector,
  selectedProtocolSelector,
} from "../../redux/selectors/network";

interface AccountComponentProps {
  account: SerializedAccountReference;
  compact?: boolean;
  asset?: IAsset;
  onGoBackFromAsset?: () => void;
}

const AccountInfo: React.FC<AccountComponentProps> = ({
  account,
  compact = false,
  asset,
  onGoBackFromAsset,
}) => {
  const theme = useTheme();
  const isPopup = useIsPopup();
  const {
    data: priceByContractAddress,
    isError: isAssetsPriceError,
    isLoading: isLoadingAssetsPrice,
    refetch: refetchAssetsPrice,
  } = useGetAssetPrices(false);

  const [showCopyTooltip, setShowCopyTooltip] = useState(false);
  const tabHasConnection = useAppSelector(tabHasConnectionSelector);
  const accountConnectedWithTab = useAppSelector(
    accountConnectedWithTabSelector
  );
  const balanceMap = useAppSelector(balanceMapConsideringAsset(asset));

  const selectedProtocol = useAppSelector(selectedProtocolSelector);
  const selectedChain = useAppSelector(selectedChainSelector);
  const symbol = useAppSelector(networkSymbolSelector);

  const {
    data: pricesByProtocolAndChain,
    isError: isNetworkPriceError,
    isLoading: isLoadingNetworkPrices,
    refetch: refetchNetworkPrices,
    isUninitialized,
  } = useGetPrices({
    pollingInterval: 60000,
  });

  const usdPrice: number =
    (asset
      ? priceByContractAddress[asset.contractAddress]
      : pricesByProtocolAndChain?.[selectedProtocol]?.[selectedChain]) || 0;
  const loadingPrice = asset
    ? isLoadingAssetsPrice
    : isLoadingNetworkPrices || isUninitialized;
  const errorPrice = asset ? isAssetsPriceError : isNetworkPriceError;
  const priceRefetch = asset ? refetchAssetsPrice : refetchNetworkPrices;

  const { address } = account || {};

  const balance = (balanceMap?.[address]?.amount as number) || 0;
  const errorBalance = balanceMap?.[address]?.error || false;
  const loadingBalance = (balanceMap?.[address]?.loading && !balance) || false;

  const getAccountBalance = useCallback(() => {
    if (address) {
      AppToBackground.getAccountBalance({
        address: address,
        chainId: selectedChain,
        protocol: selectedProtocol,
        asset: asset
          ? {
              contractAddress: asset.contractAddress,
              decimals: asset.decimals,
            }
          : undefined,
      }).catch();
    }
  }, [
    selectedProtocol,
    selectedChain,
    address,
    asset?.contractAddress,
    asset?.decimals,
  ]);

  useEffect(() => {
    if (asset) {
      setTimeout(refetchAssetsPrice, 0);
    }
  }, [asset]);

  useEffect(() => {
    getAccountBalance();
    const interval = setInterval(getAccountBalance, 30 * 1000);

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
          justifyContent={isPopup || !!asset ? "space-between" : "flex-end"}
        >
          {asset ? (
            <Stack direction={"row"} alignItems={"center"} spacing={0.5}>
              {onGoBackFromAsset && (
                <IconButton onClick={onGoBackFromAsset}>
                  <ArrowBackIcon
                    sx={{ fontSize: 18, color: theme.customColors.primary250 }}
                  />
                </IconButton>
              )}
              <Typography fontSize={12}>
                {account.name} / {asset.symbol}
              </Typography>
            </Stack>
          ) : null}
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
                {getTruncatedText(address)}
              </Typography>
              <CopyIcon />
            </Stack>
          </Tooltip>
          {isPopup && !asset && (
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
        paddingLeft={1}
        paddingRight={1.5}
        alignItems={"flex-end"}
        {...(compact && {
          marginTop: 0,
          paddingLeft: 0,
          paddingRight: 0,
        })}
      >
        <Stack
          width={1}
          height={50}
          marginBottom={1}
          paddingY={0.5}
          alignItems={"flex-end"}
          boxSizing={"border-box"}
          justifyContent={"center"}
          borderBottom={`1px solid ${theme.customColors.dark15}`}
          {...(compact && {
            height: 30,
            marginBottom: 0,
            borderBottom: "none",
            direction: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingY: 0,
            spacing: 0.7,
            width: 304,
          })}
        >
          {compact && (
            <Typography
              fontSize={14}
              fontWeight={500}
              letterSpacing={"0.5px"}
              whiteSpace={"nowrap"}
            >
              {account.name}
            </Typography>
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
            <Skeleton variant={"rectangular"} width={200} height={40} />
          ) : (
            <Stack
              direction={"row"}
              alignItems={"center"}
              justifyContent={"flex-end"}
              spacing={0.7}
              flexGrow={compact ? 1 : undefined}
              width={compact ? undefined : 335}
              minWidth={0}
            >
              <TooltipOverflow
                text={
                  roundAndSeparate(balance, asset?.decimals || 18, "0") + ""
                }
                containerProps={{
                  marginTop: compact ? "-3px!important" : 0,
                }}
                linkProps={{
                  fontSize: compact ? 16 : 24,
                  fontWeight: 500,
                  textAlign: "right",
                }}
              />
              <Typography
                fontSize={compact ? 16 : 24}
                fontWeight={500}
                color={theme.customColors.dark25}
              >
                {asset?.symbol || symbol}
              </Typography>
            </Stack>
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
                {getTruncatedText(address)}
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
                onClick={priceRefetch}
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
              ${returnNumWithTwoDecimals(balance * usdPrice, "0")} USD
            </Typography>
          )}
        </Stack>
      </Stack>
    </Stack>
  );
};

export default AccountInfo;
