import { SupportedProtocols } from "@poktscan/keyring";

export const labelByProtocolMap: Record<SupportedProtocols, string> = {
  [SupportedProtocols.Pocket]: "Pocket Network",
  [SupportedProtocols.Ethereum]: "Ethereum",
};
