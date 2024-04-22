import { useCallback, useEffect, useMemo } from "react";
import { useAppSelector } from "./redux";
import { useLazyGetPricesQuery } from "../redux/slices/prices";
import {
  assetsIdByAccountSelector,
  assetsSelector,
} from "../redux/selectors/asset";

export interface UseGetAssetPricesResult {
  data: Record<string, number>;
  isLoading: boolean;
  isError: boolean;
  canFetch: boolean;
  refetch: () => void;
}

const useGetAssetPrices = (
  fetchAutomatically = true
): UseGetAssetPricesResult => {
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

  const ids = assetsToFetch.map((asset) => asset.coinGeckoId).join(",");

  const [fetchAssetPrices, result] = useLazyGetPricesQuery({
    pollingInterval: 1000 * 60,
  });

  const fetchAssetPricesMemoized = useCallback(() => {
    if (ids) {
      return fetchAssetPrices(ids, true);
    }
  }, [ids]);

  useEffect(() => {
    if (!fetchAutomatically) return;

    const unsubscribe = fetchAssetPricesMemoized()?.unsubscribe;
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [fetchAssetPricesMemoized]);

  return useMemo(() => {
    const data = result?.data;
    const dataProcessed = {};

    const contractAddressById = assetsToFetch.reduce((acc, item) => ({
      ...acc,
      [item.coinGeckoId]: item.contractAddress,
    }));

    for (const id in contractAddressById) {
      dataProcessed[contractAddressById[id]] = data?.[id]?.usd;
    }

    return {
      data: ids ? dataProcessed || {} : {},
      isLoading: ids ? result?.isLoading || false : false,
      isError: ids ? result?.isError || false : false,
      canFetch: !!ids,
      refetch: fetchAssetPricesMemoized,
    };
  }, [
    result?.data,
    result?.isError,
    result?.isLoading,
    ids,
    assetsToFetch,
    fetchAssetPricesMemoized,
  ]);
};

export default useGetAssetPrices;
