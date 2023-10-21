import {z} from "zod";
import {ETHEREUM_PROTOCOL} from "../../values";

export const EthereumProtocolNetworkSchema = z.object({
  protocol: z.literal(ETHEREUM_PROTOCOL),
  chainID: z.enum(['11155111', '5', '1']),
  rpcUrl: z.string().url(),
});
