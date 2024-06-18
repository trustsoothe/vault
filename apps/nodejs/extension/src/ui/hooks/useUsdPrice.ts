import type { SupportedProtocols } from "@poktscan/vault";
import { useMemo } from "react";
import { networksSelector } from "../../redux/selectors/network";
import { useGetPricesQuery } from "../../redux/slices/prices";
import useDidMountEffect from "../../hooks/useDidMountEffect";
import { enqueueErrorSnackbar } from "../../utils/ui";
import { useAppSelector } from "../../hooks/redux";
import {
  assetsIdByAccountSelector,
  assetsSelector,
} from "../../redux/selectors/asset";

interface UseUsdPrice {
  protocol: SupportedProtocols;
  chainId: string;
  asset?: { contractAddress: string };
}

export default function useUsdPrice({ asset, protocol, chainId }: UseUsdPrice) {
  const networks = useAppSelector(networksSelector);

  const assets = useAppSelector(assetsSelector);
  const assetsIdByAccount = useAppSelector(assetsIdByAccountSelector);

  const assetsToFetch = useMemo(() => {
    const selectedAssets = Object.values(assetsIdByAccount).reduce(
      (acc, assetsId) => [...acc, ...assetsId],
      []
    );
    return assets.filter(
      (asset) => selectedAssets.includes(asset.id) && !!asset.coinGeckoId
    );
  }, [assets, assetsIdByAccount]);

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

    for (const assetFromList of assetsToFetch) {
      if (assetFromList.coinGeckoId) {
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
  }, [assetsToFetch, networks, asset]);

  const { isLoading, isError, refetch, data } = useGetPricesQuery(idOfCoins, {
    pollingInterval: 1000 * 60,
  });

  useDidMountEffect(() => {
    if (isError) {
      enqueueErrorSnackbar({
        message: "Fetch USD Price Failed",
        preventDuplicate: true,
        key: `fetch_usd_price_failed`,
        onRetry: refetch,
        variant: "error",
        autoHideDuration: 6000,
      });
    }
  }, [isError]);

  return {
    error: isError,
    isLoading,
    usdPrice: data?.[coinGeckoId]?.usd || 0,
    coinSymbol,
  };
}
