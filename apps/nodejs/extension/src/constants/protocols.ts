import { SupportedProtocols } from "@poktscan/keyring";
import { ChainID } from "@poktscan/keyring/dist/lib/core/common/protocols/ChainID";

export const labelByProtocolMap: Record<SupportedProtocols, string> = {
  [SupportedProtocols.Pocket]: "Pocket Network",
  [SupportedProtocols.Unspecified]: "Unspecified",
  [SupportedProtocols.Ethereum]: "Ethereum",
};

export const labelByProtocol = Object.values(SupportedProtocols).map(
  (protocol: SupportedProtocols) => ({
    label: labelByProtocolMap[protocol] || protocol,
    value: protocol,
  })
);

export const chainIDsByProtocol: Record<
  SupportedProtocols,
  ChainID<SupportedProtocols>[]
> = {
  [SupportedProtocols.Pocket]: ["mainnet", "testnet"],
  [SupportedProtocols.Ethereum]: ["11155111", "5", "1"],
  [SupportedProtocols.Unspecified]: ["unspecified"],
};

export const labelByChainID: Record<ChainID<SupportedProtocols>, string> = {
  mainnet: "Mainnet",
  testnet: "Testnet",
  unspecified: "Unspecified",
  "11155111": "Ethereum Sepolia",
  "5": "Ethereum Goerli",
  "1": "Ethereum Mainnet",
};

interface PriceIdByProtocolAndChain {
  [SupportedProtocols.Ethereum]: Partial<
    Record<ChainID<SupportedProtocols.Ethereum>, string>
  >;
  [SupportedProtocols.Pocket]: Partial<
    Record<ChainID<SupportedProtocols.Pocket>, string>
  >;
}

// the chain ids not found here is because their price is equal to $0
export const priceIdByProtocolAndChain: PriceIdByProtocolAndChain = {
  [SupportedProtocols.Pocket]: {
    mainnet: "pocket-network",
  },
  [SupportedProtocols.Ethereum]: {
    "1": "ethereum",
    "5": "goerli-eth",
  },
};
