import {z} from "zod";
import {ETHEREUM_PROTOCOL} from "../../values";

export const EthereumProtocolNetworkSchema = z.object({
  protocol: z.literal(ETHEREUM_PROTOCOL),
  chainID: z.enum(['11155111', '5', '1']),
  rpcUrl: z.string().url(),
});

export const EthereumProtocolFeeRequestSchema = z.object({
  protocol: z.literal(ETHEREUM_PROTOCOL),
  to: z.string(),
  from: z.string().optional(),
  value: z.string().optional(),
  data: z.string().optional(),
});

export const EthereumProtocolSendTransactionForStatusResponseSchema = z.object({
  id: z.string(),
  error: z.object({
    code: z.union([z.literal(-32600), z.literal(-32602), z.literal(-32000), z.literal(-32003)]),
    message: z.string(),
  }),
  jsonrpc: z.literal('2.0'),
});
