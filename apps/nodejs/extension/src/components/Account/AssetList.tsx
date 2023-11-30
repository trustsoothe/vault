import type { IAsset } from "../../redux/slices/app";
import React, { useCallback, useEffect } from "react";
import Stack from "@mui/material/Stack";
import { useTheme } from "@mui/material";
import Button from "@mui/material/Button";
import Skeleton from "@mui/material/Skeleton";
import Typography from "@mui/material/Typography";
import useGetAssetPrices, {
  UseGetAssetPricesResult,
} from "../../hooks/useGetAssetPrices";
import { useAppSelector } from "../../hooks/redux";
import TooltipOverflow from "../common/TooltipOverflow";
import { returnNumWithTwoDecimals, roundAndSeparate } from "../../utils/ui";
import AppToBackground from "../../controllers/communication/AppToBackground";
import {
  selectedChainSelector,
  selectedProtocolSelector,
} from "../../redux/selectors/network";
import {
  balanceMapConsideringAsset,
  selectedAccountAddressSelector,
} from "../../redux/selectors/account";

interface AssetItemProps {
  asset: IAsset;
  assetsPriceResult: UseGetAssetPricesResult;
  onClickAsset: (asset: IAsset) => void;
}

const AssetItem: React.FC<AssetItemProps> = ({
  asset,
  assetsPriceResult,
  onClickAsset,
}) => {
  const { data, isError, isLoading, canFetch, refetch } = assetsPriceResult;
  const theme = useTheme();

  const selectedProtocol = useAppSelector(selectedProtocolSelector);
  const selectedChain = useAppSelector(selectedChainSelector);

  const selectedAccountAddress = useAppSelector(selectedAccountAddressSelector);

  const balanceMap = useAppSelector(balanceMapConsideringAsset(asset));

  const getAccountBalance = useCallback(() => {
    if (selectedAccountAddress) {
      AppToBackground.getAccountBalance({
        address: selectedAccountAddress,
        chainId: selectedChain as any,
        protocol: selectedProtocol,
        asset: {
          contractAddress: asset.contractAddress,
          decimals: asset.decimals,
        },
      }).catch();
    }
  }, [
    selectedProtocol,
    selectedChain,
    selectedAccountAddress,
    asset?.contractAddress,
    asset?.decimals,
  ]);

  useEffect(() => {
    getAccountBalance();
    const interval = setInterval(getAccountBalance, 6e4);

    return () => clearInterval(interval);
  }, [getAccountBalance]);

  // todo: create hook to get balance
  const balance = (balanceMap?.[selectedAccountAddress]?.amount as number) || 0;
  const errorBalance = balanceMap?.[selectedAccountAddress]?.error || false;
  const loadingBalance =
    (balanceMap?.[selectedAccountAddress]?.loading && !balance) || false;

  const assetUsdPrice = data[asset.contractAddress] || 0;

  return (
    <Stack
      height={36}
      minHeight={36}
      marginTop={0.2}
      paddingX={1}
      direction={"row"}
      borderBottom={`1px solid ${theme.customColors.dark15}`}
      sx={{
        cursor: "pointer",
      }}
      onClick={() => onClickAsset(asset)}
    >
      <Stack direction={"row"} alignItems={"center"} spacing={0.5} width={80}>
        <img
          src={asset.iconUrl}
          alt={`${asset.protocol}-${asset.chainId}-img`}
          width={20}
          height={20}
        />
        <Typography fontSize={13} letterSpacing={"0.5px"} lineHeight={"20px"}>
          {asset.symbol}
        </Typography>
      </Stack>
      {errorBalance ? (
        <Stack
          direction={"row"}
          alignItems={"center"}
          spacing={1}
          width={"calc(100% - 80px)"}
          justifyContent={"flex-end"}
        >
          <Typography fontSize={12} lineHeight={"20px"}>
            Balance error.
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
        </Stack>
      ) : (
        <>
          <Stack
            direction={"row"}
            alignItems={"center"}
            spacing={0.5}
            width={canFetch ? 125 : 250}
            justifyContent={"flex-end"}
          >
            {loadingBalance ? (
              <Skeleton variant={"rectangular"} height={16} width={100} />
            ) : (
              <>
                <TooltipOverflow
                  text={roundAndSeparate(balance, asset.decimals, "0")}
                  enableTextCopy={false}
                  textProps={{
                    marginTop: -0.7,
                  }}
                  linkProps={{
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: "0.5px",
                    lineHeight: "20px",
                  }}
                />
                <Typography
                  color={theme.customColors.dark50}
                  fontSize={12}
                  fontWeight={600}
                >
                  {asset.symbol}
                </Typography>
              </>
            )}
          </Stack>
          {canFetch && (
            <Stack
              direction={"row"}
              alignItems={"center"}
              spacing={0.5}
              width={125}
              paddingLeft={0.5}
              boxSizing={"border-box"}
              justifyContent={"flex-end"}
            >
              {isLoading || loadingBalance ? (
                <Skeleton variant={"rectangular"} height={16} width={100} />
              ) : isError ? (
                <Typography fontSize={12} lineHeight={"20px"}>
                  Prices error.
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
                    onClick={refetch}
                  >
                    Retry
                  </Button>
                </Typography>
              ) : (
                <>
                  <TooltipOverflow
                    text={`$${returnNumWithTwoDecimals(
                      balance * assetUsdPrice,
                      "0"
                    )}`}
                    enableTextCopy={false}
                    textProps={{
                      marginTop: -0.7,
                    }}
                    linkProps={{
                      fontSize: 12,
                      letterSpacing: "0.5px",
                      lineHeight: "20px",
                      color: theme.customColors.dark100,
                      fontWeight: 400,
                    }}
                  />
                  <Typography fontSize={12}>USD</Typography>
                </>
              )}
            </Stack>
          )}
        </>
      )}
    </Stack>
  );
};

interface AssetListProps {
  assets: IAsset[];
  onClickAction: () => void;
  actionText: string;
  onClickAsset: (asset: IAsset) => void;
}

const AssetList: React.FC<AssetListProps> = ({
  assets,
  onClickAction,
  actionText,
  onClickAsset,
}) => {
  const theme = useTheme();
  const assetsPriceResult = useGetAssetPrices();

  return (
    <Stack width={1} height={200} marginTop={3}>
      <Stack
        direction={"row"}
        alignItems={"center"}
        justifyContent={"space-between"}
        height={30}
        borderBottom={`1px solid ${theme.customColors.dark25}`}
        paddingX={1}
      >
        <Typography fontSize={12} fontWeight={500}>
          Account Assets
        </Typography>
        <Button
          sx={{
            fontSize: 11,
            padding: 0,
            color: theme.customColors.primary500,
            fontWeight: 500,
            width: 60,
            minWidth: 60,
            height: 20,
            textDecoration: "underline",
            "&:hover": { textDecoration: "underline" },
          }}
          onClick={onClickAction}
        >
          {actionText}
        </Button>
      </Stack>
      <Stack
        flexGrow={1}
        bgcolor={theme.customColors.dark2}
        paddingX={0.5}
        overflow={"auto"}
      >
        {!assets.length ? (
          <Typography
            sx={{ userSelect: "none" }}
            textAlign={"center"}
            lineHeight={"169px"}
            fontSize={12}
            fontWeight={500}
            letterSpacing={"0.5px"}
            color={theme.customColors.primary250}
          >
            NO ASSETS
          </Typography>
        ) : (
          assets.map((asset) => (
            <AssetItem
              key={asset.id}
              asset={asset}
              onClickAsset={onClickAsset}
              assetsPriceResult={assetsPriceResult}
            />
          ))
        )}
      </Stack>
    </Stack>
  );
};

export default AssetList;
