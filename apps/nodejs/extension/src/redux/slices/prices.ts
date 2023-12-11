import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const pricesApi = createApi({
  reducerPath: "pricesApi",
  baseQuery: fetchBaseQuery({ baseUrl: process.env.PRICE_API_BASE_URL }),
  endpoints: (builder) => ({
    getPrices: builder.query({
      query: (ids: string) => `simple/price?ids=${ids}&vs_currencies=usd`,
    }),
    getAssetPrices: builder.query({
      query: ({
        platformId,
        contractAddresses,
      }: {
        platformId: string;
        contractAddresses: string;
      }) =>
        `simple/token_price/${platformId}?contract_addresses=${contractAddresses}&vs_currencies=usd`,
      keepUnusedDataFor: 60 * 3,
    }),
  }),
});

export const {
  useGetPricesQuery,
  useLazyGetPricesQuery,
  useGetAssetPricesQuery,
  useLazyGetAssetPricesQuery,
} = pricesApi;
