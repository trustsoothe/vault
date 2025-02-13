import { SupportedProtocols } from "@soothe/vault";

export const labelByProtocolMap: Record<SupportedProtocols, string> = {
  [SupportedProtocols.Pocket]: "Pocket Network (Morse)",
  [SupportedProtocols.Ethereum]: "EVM",
  [SupportedProtocols.Cosmos]: "",
};

export const labelByAddressPrefixMap: Record<string, string> = {
  pokt: "Pocket Network (Shannon)",
};
