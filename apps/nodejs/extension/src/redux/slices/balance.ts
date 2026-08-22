import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import { WebEncryptionService } from "@soothe/vault-encryption-web";
import {
  AccountReference,
  IAsset,
  ProtocolServiceFactory,
  SupportedProtocols,
} from "@soothe/vault";
import { resetErrorOfNetworks, setNetworksWithErrors } from "./app";
import {
  READ_RPC_RETRIES,
  READ_RPC_TIMEOUT_MS,
  runWithNetworks,
} from "../../utils/networkOperations";

export interface GetAccountBalanceArg {
  address: string;
  protocol: SupportedProtocols;
  chainId: string;
  asset?: { contractAddress: string; decimals: number };
}

export interface BalanceQueryError {
  name: string;
  message: string;
  protocol: SupportedProtocols;
  chainId: string;
}

/**
 * Errors thrown by the protocol services are class instances; they do not
 * survive the JSON serialization done when the action travels to the
 * background store, so we keep a plain object with the useful bits
 * (including the inner cause when present) to show it to the user.
 */
function serializeBalanceError(
  error: unknown,
  { protocol, chainId }: Pick<GetAccountBalanceArg, "protocol" | "chainId">
): BalanceQueryError {
  const err = error as
    | { name?: string; message?: string; innerError?: { message?: string } }
    | undefined;
  const innerMessage = err?.innerError?.message;
  const message = err?.message || "Unknown error";

  return {
    name: err?.name || "Error",
    message:
      innerMessage && innerMessage !== message
        ? `${message}: ${innerMessage}`
        : message,
    protocol,
    chainId,
  };
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

          const { result, rpcWithErrors, rpcWithSuccess } =
            await runWithNetworks(
              {
                protocol,
                chainId,
                customRpcs,
                networks,
                errorsPreferredNetwork,
                timeout: READ_RPC_TIMEOUT_MS,
                retries: READ_RPC_RETRIES,
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
                      ([
                        SupportedProtocols.Pocket,
                        SupportedProtocols.Cosmos,
                      ].includes(protocol)
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

          if (rpcWithSuccess.length) {
            await api.dispatch(resetErrorOfNetworks(rpcWithSuccess));
          }

          return { data: result };
        } catch (error) {
          return { error: serializeBalanceError(error, { protocol, chainId }) };
        }
      },
    }),
  }),
});

export const { useGetBalanceQuery } = balanceApi;
