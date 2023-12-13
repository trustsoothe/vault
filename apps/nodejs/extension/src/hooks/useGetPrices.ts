import { useMemo } from "react";
import { SupportedProtocols } from "@poktscan/keyring";
import { useGetPricesQuery } from "../redux/slices/prices";
import { useAppSelector } from "./redux";
import { networksSelector } from "../redux/selectors/network";

export interface NetworkPrices {
  [SupportedProtocols.Pocket]: Record<string, number>;
  [SupportedProtocols.Ethereum]: Record<string, number>;
}

const useGetPrices = (
  options?: Parameters<typeof useGetPricesQuery>[1]
): ReturnType<typeof useGetPricesQuery> & { data?: NetworkPrices } => {
  const networks = useAppSelector(networksSelector);
  const ids = networks
    .filter((item) => !!item.coinGeckoId)
    .map((item) => item.coinGeckoId)
    .join(",");

  const result = useGetPricesQuery(ids, options);

  return useMemo(() => {
    if (!result.data) return result;

    const objectToReturn: NetworkPrices = {
      [SupportedProtocols.Ethereum]: {},
      [SupportedProtocols.Pocket]: {},
    };

    for (const network of networks) {
      const { protocol, chainId, coinGeckoId } = network;

      objectToReturn[protocol][chainId] = result.data[coinGeckoId]?.usd || 0;
    }

    return {
      ...result,
      data: objectToReturn,
    };
  }, [result, result?.data, networks]);
};

export default useGetPrices;
