import { useCallback, useMemo } from "react";
import { useAppSelector } from "./redux";
import useDidMountEffect from "./useDidMountEffect";
import { useLazyGetAssetPricesQuery } from "../redux/slices/prices";

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
  const selectedProtocol = useAppSelector((state) => state.app.selectedNetwork);
  const selectedChain = useAppSelector(
    (state) => state.app.selectedChainByNetwork[selectedProtocol]
  );
  const assets = useAppSelector((state) => state.app.assets);
  const assetsIdByAccountId = useAppSelector(
    (state) => state.app.assetsIdByAccountId
  );

  const currentPlatform = useAppSelector(
    (state) =>
      state.app.networks.find(
        (network) =>
          network.protocol === selectedProtocol &&
          network.chainId === selectedChain
      )?.assetPlatformId
  );

  const contractAddressToFetch = useMemo(() => {
    const selectedAssets = Object.values(assetsIdByAccountId).reduce(
      (acc, assetsId) => [...acc, ...assetsId],
      []
    );
    return assets
      .filter(
        (asset) =>
          asset.protocol === selectedProtocol &&
          asset.chainId === selectedChain &&
          selectedAssets.includes(asset.id)
      )
      .map((asset) => asset.contractAddress)
      .join(",");
  }, [selectedProtocol, selectedChain, assets, assetsIdByAccountId]);

  const [fetchAssetPrices, result] = useLazyGetAssetPricesQuery({
    pollingInterval: 1000 * 60,
  });

  const canFetch = !!currentPlatform && !!contractAddressToFetch;

  const fetchAssetPricesMemoized = useCallback(() => {
    if (canFetch) {
      return fetchAssetPrices(
        {
          platformId: currentPlatform,
          contractAddresses: contractAddressToFetch,
        },
        true
      );
    }
  }, [currentPlatform, contractAddressToFetch]);

  useDidMountEffect(() => {
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

    for (const contractAddress in data || {}) {
      dataProcessed[contractAddress] = data?.[contractAddress]?.usd;
    }

    return {
      data: canFetch ? dataProcessed || {} : {},
      isLoading: canFetch ? result?.isLoading || false : false,
      isError: canFetch ? result?.isError || false : false,
      canFetch,
      refetch: fetchAssetPricesMemoized,
    };
  }, [
    result?.data,
    result?.isError,
    result?.isLoading,
    canFetch,
    fetchAssetPricesMemoized,
  ]);
};

export default useGetAssetPrices;
