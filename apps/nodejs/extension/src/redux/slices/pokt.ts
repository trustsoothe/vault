import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import {
  PocketNetworkProtocolService,
  SupportedProtocols,
} from "@poktscan/vault";
import { WebEncryptionService } from "@poktscan/vault-encryption-web";
import { setNetworksWithErrors } from "./app";
import { isValidAddress, runWithNetworks } from "../../utils/networkOperations";

export interface AllParams {
  app_params: ParamKeyValue[];
  auth_params: ParamKeyValue[];
  gov_params: ParamKeyValue[];
  node_params: ParamKeyValue[];
  pocket_params: ParamKeyValue[];
}

export interface ParamKeyValue {
  param_key: string;
  param_value: string;
}

export type ChainsMap = Record<
  string,
  {
    label: string;
    image: string;
    mainColor: string;
  }
>;

export interface Node {
  address: string;
  chains: string[];
  jailed: boolean;
  output_address: string;
  public_key: string;
  reward_delegators: Record<string, number> | null;
  service_url: string;
  status: number;
  tokens: string;
  unstaking_time: string;
}

export interface App {
  address: string;
  chains: string[];
  jailed: boolean;
  max_relays: string;
  public_key: string;
  staked_tokens: string;
  status: number;
  unstaking_time: string;
}

const poktService = new PocketNetworkProtocolService(
  new WebEncryptionService()
);

const MAINNET_URL = process.env.POKT_MAINNET_CHAIN_MAPS_URL;
const TESTNET_URL = process.env.POKT_TESTNET_CHAIN_MAPS_URL;

export const poktApi = createApi({
  reducerPath: "poktApi",
  baseQuery: fakeBaseQuery(),
  refetchOnReconnect: false,
  refetchOnFocus: false,
  endpoints: (builder) => ({
    getAllParams: builder.query({
      queryFn: async (chainId: string, api) => {
        try {
          const {
            app: { customRpcs, networks, errorsPreferredNetwork },
          } = api.getState() as any;

          const { result, rpcWithErrors } = await runWithNetworks(
            {
              protocol: SupportedProtocols.Pocket,
              chainId,
              customRpcs,
              networks,
              errorsPreferredNetwork,
            },
            async (network) => {
              return {
                data: (await poktService.getAllParamsByHeight(
                  network
                )) as AllParams,
              };
            }
          );

          if (rpcWithErrors.length) {
            await api.dispatch(setNetworksWithErrors(rpcWithErrors));
          }

          return result;
        } catch (e) {
          return { error: e };
        }
      },
    }),
    getChainsMap: builder.query({
      queryFn: async (chainId: string) => {
        try {
          const url = chainId === "mainnet" ? MAINNET_URL : TESTNET_URL;

          if (!url) {
            return { data: {} as ChainsMap };
          }

          const data = (await globalThis
            .fetch(url)
            .then((res) => res.json())) as ChainsMap;

          return { data };
        } catch (e) {
          return { error: e };
        }
      },
    }),
    getNode: builder.query({
      queryFn: async (arg: { address: string; chainId: string }, api) => {
        try {
          const { address, chainId } = arg;

          const {
            app: { customRpcs, networks, errorsPreferredNetwork },
          } = api.getState() as any;

          const { result, rpcWithErrors } = await runWithNetworks(
            {
              protocol: SupportedProtocols.Pocket,
              chainId,
              customRpcs,
              networks,
              errorsPreferredNetwork,
            },
            async (network) => {
              return {
                data: (await poktService.queryNode(
                  isValidAddress(address, SupportedProtocols.Pocket)
                    ? address
                    : await poktService.getAddressFromPublicKey(address),
                  network
                )) as Node | null,
              };
            }
          );

          if (rpcWithErrors.length) {
            await api.dispatch(setNetworksWithErrors(rpcWithErrors));
          }

          return result;
        } catch (e) {
          return { error: e };
        }
      },
    }),
    getApp: builder.query({
      queryFn: async (arg: { address: string; chainId: string }, api) => {
        try {
          const { address, chainId } = arg;

          const {
            app: { customRpcs, networks, errorsPreferredNetwork },
          } = api.getState() as any;

          const { result, rpcWithErrors } = await runWithNetworks(
            {
              protocol: SupportedProtocols.Pocket,
              chainId,
              customRpcs,
              networks,
              errorsPreferredNetwork,
            },
            async (network) => {
              return {
                data: (await poktService.queryApp(
                  isValidAddress(address, SupportedProtocols.Pocket)
                    ? address
                    : await poktService.getAddressFromPublicKey(address),
                  network
                )) as App | null,
              };
            }
          );

          if (rpcWithErrors.length) {
            await api.dispatch(setNetworksWithErrors(rpcWithErrors));
          }

          return result;
        } catch (e) {
          return { error: e };
        }
      },
    }),
  }),
});

export const {
  useGetAllParamsQuery,
  useGetAppQuery,
  useGetChainsMapQuery,
  useGetNodeQuery,
} = poktApi;
