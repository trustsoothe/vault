import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import store from "../store";
import { SupportedProtocols } from "@poktscan/keyring";
import { ChainID } from "@poktscan/keyring/dist/lib/core/common/protocols/ChainID";
import {
  chainIDsByProtocol,
  priceIdByProtocolAndChain,
} from "../../constants/protocols";

interface NetworkPrices {
  [SupportedProtocols.Pocket]: Record<
    ChainID<SupportedProtocols.Pocket>,
    number
  >;
  [SupportedProtocols.Ethereum]: Record<
    ChainID<SupportedProtocols.Ethereum>,
    number
  >;
}

export const pricesApi = createApi({
  reducerPath: "pricesApi",
  // keepUnusedDataFor: 60,
  baseQuery: fetchBaseQuery({ baseUrl: "https://api.coingecko.com/api/v3/" }),
  endpoints: (builder) => ({
    getPrices: builder.query({
      query: (_: void) => {
        let ids = "";

        // todo: define a way to know the networks the user use (has selected alongside the default ones)
        for (const idByChainId of Object.values(priceIdByProtocolAndChain)) {
          for (const id of Object.values(idByChainId)) {
            if (ids) {
              ids += `,${id}`;
            } else {
              ids = id as string;
            }
          }
        }

        return `simple/price?ids=${ids}&vs_currencies=usd`;
      },
      transformResponse(baseQueryReturnValue, meta, arg) {
        const objectToReturn: NetworkPrices = {
          [SupportedProtocols.Ethereum]: {
            "1": 0,
            "5": 0,
            "11155111": 0,
          },
          [SupportedProtocols.Pocket]: {
            mainnet: 0,
            testnet: 0,
          },
        };

        for (const protocol of Object.keys(priceIdByProtocolAndChain)) {
          const chainIdsOfProtocol = chainIDsByProtocol[protocol];

          for (const chainId of chainIdsOfProtocol) {
            const priceId = priceIdByProtocolAndChain[protocol][chainId];

            if (priceId) {
              objectToReturn[protocol][chainId] =
                baseQueryReturnValue[priceId]?.usd || 0;
            } else {
              objectToReturn[protocol][chainId] = 0;
            }
          }
        }

        return objectToReturn;
      },
    }),
  }),
});

export const { useGetPricesQuery, useLazyGetPricesQuery } = pricesApi;
