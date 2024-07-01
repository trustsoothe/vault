import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { Status } from "../../components/Account/WrappedPoktTxs";

const MAINNET_BASE_API_URL = process.env.WPOKT_MAINNET_API_BASE_URL;
const TESTNET_BASE_API_URL = process.env.WPOKT_TESTNET_API_BASE_URL;

export interface MintTransaction {
  _id: string;
  transaction_hash: string;
  confirmations: string;
  sender_address: string;
  sender_chain_id: string;
  recipient_address: string;
  recipient_chain_id: string;
  wpokt_address: string;
  amount: string;
  status: Status;
  signers: string[];
  created_at: string;
  updated_at: string;
  height: string;
  vault_address: string;
  nonce: string;
  memo: {
    address: string;
    chain_id: string;
  };
  data: {
    recipient: string;
    amount: string;
    nonce: string;
  };
  signatures: string[];
  mint_tx_hash: string;
}

export const wpoktApi = createApi({
  reducerPath: "wpoktApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "https://",
  }),
  endpoints: (builder) => ({
    getActiveMints: builder.query<
      Array<MintTransaction>,
      {
        chain: "mainnet" | "testnet";
        recipient: string;
      }
    >({
      query: ({ recipient, chain }) =>
        `${(chain === "mainnet"
          ? MAINNET_BASE_API_URL
          : TESTNET_BASE_API_URL
        ).replace("https://", "")}/mints/active?recipient=${recipient}`,
    }),
  }),
});

export const { useLazyGetActiveMintsQuery } = wpoktApi;
