import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import { WebEncryptionService } from "@poktscan/vault-encryption-web";
import {
  AccountReference,
  IAsset,
  ProtocolServiceFactory,
  SupportedProtocols,
} from "@poktscan/vault";
import { setNetworksWithErrors } from "./app";
import { runWithNetworks } from "../../utils/networkOperations";

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
        {
          address,
          protocol,
          chainId,
          asset: partialAsset,
        }: GetAccountBalanceArg,
        api
      ) => {
        try {
          const {
            app: { networks, customRpcs, errorsPreferredNetwork },
          } = api.getState() as any;

          const accountReference = new AccountReference({
            id: "",
            name: "",
            address,
            protocol,
            publicKey: "",
          });

          const protocolService = ProtocolServiceFactory.getProtocolService(
            protocol,
            new WebEncryptionService()
          );

          const { result, rpcWithErrors } = await runWithNetworks(
            {
              protocol,
              chainId,
              customRpcs,
              networks,
              errorsPreferredNetwork,
            },
            async (network) => {
              const asset: IAsset =
                protocol === SupportedProtocols.Ethereum && partialAsset
                  ? {
                      ...partialAsset,
                      protocol,
                      chainID: chainId,
                    }
                  : undefined;
              const balance = await protocolService.getBalance(
                accountReference,
                network,
                asset
              );

              return balance
                ? balance /
                    ([SupportedProtocols.Pocket, SupportedProtocols.PocketShannon].includes(protocol)
                      ? 1e6
                      : asset
                      ? 1
                      : 1e18)
                : 0;
            }
          );

          if (rpcWithErrors.length) {
            await api.dispatch(setNetworksWithErrors(rpcWithErrors));
          }

          return { data: result };
        } catch (error) {
          return { error };
        }
      },
    }),
  }),
});

export const { useGetBalanceQuery } = balanceApi;
