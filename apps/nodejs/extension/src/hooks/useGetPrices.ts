import { useMemo } from "react";
import { SupportedProtocols } from "@poktscan/keyring";
import { useGetPricesQuery } from "../redux/slices/prices";
import { useAppSelector } from "./redux";

export interface NetworkPrices {
  [SupportedProtocols.Pocket]: Record<string, number>;
  [SupportedProtocols.Ethereum]: Record<string, number>;
}

const useGetPrices = (
  options?: Parameters<typeof useGetPricesQuery>[1]
): ReturnType<typeof useGetPricesQuery> & { data?: NetworkPrices } => {
  const networks = useAppSelector((state) => state.app.networks);
  const ids = networks
    .filter((item) => !!item.coinGeckoId)
    .map((item) => item.coinGeckoId)
    .join(",");

  const result = useGetPricesQuery(ids, options);

  const data = useMemo(() => {
    if (!result.data) return result.data;

    const objectToReturn: NetworkPrices = {
      [SupportedProtocols.Ethereum]: {},
      [SupportedProtocols.Pocket]: {},
    };

    for (const network of networks) {
      const { protocol, chainId, coinGeckoId } = network;

      objectToReturn[protocol][chainId] = result.data[coinGeckoId]?.usd || 0;
    }

    return objectToReturn;
  }, [result?.data, networks]);

  return {
    ...result,
    data,
  };
};

export default useGetPrices;
