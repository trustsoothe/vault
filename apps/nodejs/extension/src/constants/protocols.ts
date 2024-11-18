import { SupportedProtocols } from "@poktscan/vault";

export const labelByProtocolMap: Record<SupportedProtocols, string> = {
  [SupportedProtocols.Pocket]: "Pocket Network (Morse)",
  [SupportedProtocols.Ethereum]: "Ethereum",
  [SupportedProtocols.PocketShannon]: "Pocket Network (Shannon)",
};
