// TODO: check to replace enums with frozen objects to improve type safety when using 'import type
import type {
  SupportedProtocols,
  SupportedProtocolsArray,
} from "@soothe/vault";

export const PocketProtocol = "Pocket" as SupportedProtocols.Pocket;
export const EthereumProtocol = "Ethereum" as SupportedProtocols.Ethereum;
export const CosmosProtocol = "Cosmos" as SupportedProtocols.Cosmos;

export const supportedProtocolsArray: SupportedProtocolsArray = [
  PocketProtocol,
  EthereumProtocol,
  CosmosProtocol,
];

export const labelByProtocolMap: Record<SupportedProtocols, string> = {
  [PocketProtocol]: "Pocket Network (Morse)",
  [EthereumProtocol]: "EVM",
  [CosmosProtocol]: "Pocket Network (Shannon)",
};

export const labelByAddressPrefixMap: Record<string, string> = {
  pokt: "Pocket Network (Shannon)",
};
