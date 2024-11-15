import {z} from "zod";
import {POCKET_NETWORK_PROTOCOL, POCKET_NETWORK_SHANNON_PROTOCOL} from "../../values";

export const PocketShannonProtocolNetworkSchema = z.object({
  protocol: z.literal(POCKET_NETWORK_SHANNON_PROTOCOL),
  chainID: z.enum(['poktroll']),
  rpcUrl: z.string().url(),
});
