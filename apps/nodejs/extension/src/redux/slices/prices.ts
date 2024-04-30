import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const pricesApi = createApi({
  reducerPath: "pricesApi",
  baseQuery: fetchBaseQuery({ baseUrl: process.env.PRICE_API_BASE_URL }),
  endpoints: (builder) => ({
    getPrices: builder.query({
      query: (ids: string) => `simple/price?ids=${ids}&vs_currencies=usd`,
    }),
  }),
});

export const { useGetPricesQuery, useLazyGetPricesQuery } = pricesApi;
