import {z} from "zod";
import {POCKET_NETWORK_PROTOCOL, POCKET_NETWORK_SHANNON_PROTOCOL} from "../../values";

export const PocketShannonProtocolNetworkSchema = z.object({
  protocol: z.literal(POCKET_NETWORK_SHANNON_PROTOCOL),
  chainID: z.enum(['poktroll']),
  rpcUrl: z.string().url(),
});

export const PocketShannonRpcCanSendTransactionResponseSchema = z.object({
  jsonrpc: z.literal('2.0'),
  id: z.number(),
  result: z.object({
    code: z.number(),
    data: z.string(),
    log: z.string(),
    codespace: z.string(),
    hash: z.string(),
  }),
});
