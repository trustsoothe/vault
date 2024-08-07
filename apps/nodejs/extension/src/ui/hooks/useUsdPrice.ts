import type { SupportedProtocols } from "@poktscan/vault";
import { useEffect, useMemo, useRef } from "react";
import { shallowEqual } from "react-redux";
import { closeSnackbar, SnackbarKey } from "notistack";
import { networksSelector } from "../../redux/selectors/network";
import { useGetPricesQuery } from "../../redux/slices/prices";
import useDidMountEffect from "./useDidMountEffect";
import { enqueueErrorSnackbar } from "../../utils/ui";
import { useAppSelector } from "./redux";
import {
  assetsIdByAccountSelector,
  assetsSelector,
} from "../../redux/selectors/asset";

interface UseUsdPrice {
  protocol: SupportedProtocols;
  chainId: string;
  asset?: { contractAddress: string };
  forceInitialFetch?: boolean;
}

export default function useUsdPrice({
  asset,
  protocol,
  chainId,
  forceInitialFetch = false,
}: UseUsdPrice) {
  const lastSnackbarKeyRef = useRef<SnackbarKey>(null);
  const networks = useAppSelector(networksSelector);

  const assets = useAppSelector(assetsSelector);
  const assetsIdByAccount = useAppSelector(
    assetsIdByAccountSelector,
    shallowEqual
  );

  const { coinGeckoId, idOfCoins, coinSymbol } = useMemo(() => {
    let coinGeckoId: string, coinSymbol: string;

    const idOfCoins: Array<string> = [];

    for (const network of networks) {
      if (network.coinGeckoId) {
        idOfCoins.push(network.coinGeckoId);
      }

      if (
        !asset &&
        network.protocol === protocol &&
        network.chainId === chainId
      ) {
        coinSymbol = network.currencySymbol;
        coinGeckoId = network.coinGeckoId;
      }
    }

    const selectedAssets = Object.values(assetsIdByAccount || {}).reduce(
      (acc, assetsId) => [...acc, ...assetsId],
      []
    );

    for (const assetFromList of assets) {
      if (
        assetFromList.coinGeckoId &&
        selectedAssets.includes(assetFromList.id)
      ) {
        idOfCoins.push(assetFromList.coinGeckoId);
      }

      if (
        asset &&
        assetFromList.contractAddress === asset.contractAddress &&
        assetFromList.protocol === protocol &&
        assetFromList.chainId === chainId
      ) {
        coinSymbol = assetFromList.symbol;
        coinGeckoId = assetFromList.coinGeckoId;
      }
    }

    return { coinGeckoId, idOfCoins: idOfCoins.join(","), coinSymbol };
  }, [assets, networks, asset, assetsIdByAccount]);

  const { isLoading, isError, refetch, data } = useGetPricesQuery(idOfCoins, {
    pollingInterval: 1000 * 60,
  });

  useEffect(() => {
    if (!isLoading && forceInitialFetch) {
      refetch();
    }
  }, []);

  useDidMountEffect(() => {
    if (isError) {
      lastSnackbarKeyRef.current = enqueueErrorSnackbar({
        message: "Fetch USD Price Failed",
        preventDuplicate: true,
        key: `fetch_usd_price_failed`,
        onRetry: refetch,
        variant: "error",
        autoHideDuration: 6000,
      });
    }

    return () => {
      if (lastSnackbarKeyRef.current) {
        closeSnackbar(lastSnackbarKeyRef.current);
        lastSnackbarKeyRef.current = null;
      }
    };
  }, [isError, idOfCoins]);

  return {
    error: isError,
    isLoading,
    usdPrice: data?.[coinGeckoId]?.usd || 0,
    coinSymbol,
  };
}
