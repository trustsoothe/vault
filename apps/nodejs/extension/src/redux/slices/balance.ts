import type { SupportedProtocols } from "@poktscan/vault";
import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import { setNetworksWithErrors } from "./app";
import {
  getAccountBalance as getBalance,
  NetworkForOperations,
} from "../../utils/networkOperations";

export interface GetAccountBalanceArg {
  address: string;
  protocol: SupportedProtocols;
  chainId: string;
  asset?: { contractAddress: string; decimals: number };
}

export const balanceApi = createApi({
  keepUnusedDataFor: 25,
  refetchOnMountOrArgChange: true,
  reducerPath: "balanceApi",
  baseQuery: fakeBaseQuery(),
  endpoints: (builder) => ({
    getBalance: builder.query({
      queryFn: async (
        { address, protocol, chainId, asset }: GetAccountBalanceArg,
        api
      ) => {
        try {
          const {
            app: { networks, customRpcs, errorsPreferredNetwork },
          } = api.getState() as any;

          const allNetworks = [
            ...networks.map(
              (network) =>
                ({
                  protocol: network.protocol,
                  id: network.id,
                  chainID: network.chainId,
                  isDefault: true,
                  isPreferred: false,
                  rpcUrl: network.rpcUrl,
                } as NetworkForOperations)
            ),
            ...customRpcs.map(
              (rpc) =>
                ({
                  protocol: rpc.protocol,
                  id: rpc.id,
                  chainID: rpc.chainId,
                  isDefault: false,
                  isPreferred: rpc.isPreferred,
                  rpcUrl: rpc.url,
                } as NetworkForOperations)
            ),
          ];

          const result = await getBalance({
            address,
            protocol,
            chainId,
            networks: allNetworks,
            errorsPreferredNetwork,
            asset,
          });

          if (result.networksWithErrors.length) {
            api.dispatch(setNetworksWithErrors(result.networksWithErrors));
          }

          return { data: result.balance };
        } catch (error) {
          return { error };
        }
      },
    }),
  }),
});

export const { useGetBalanceQuery } = balanceApi;
