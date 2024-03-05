import { SupportedProtocols } from "@soothe/vault";

export const labelByProtocolMap: Record<SupportedProtocols, string> = {
  [SupportedProtocols.Pocket]: "Pocket Network",
  [SupportedProtocols.Ethereum]: "Ethereum",
};
