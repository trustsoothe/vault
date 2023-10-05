import type { ChainID } from "@poktscan/keyring/dist/lib/core/common/IProtocol";
import { SupportedProtocols } from "@poktscan/keyring";

export const labelByProtocolMap: Record<SupportedProtocols, string> = {
  [SupportedProtocols.Pocket]: "Pocket Network",
  [SupportedProtocols.Unspecified]: "Unspecified",
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
  [SupportedProtocols.Unspecified]: ["unspecified"],
};

export const labelByChainID: Record<ChainID<SupportedProtocols>, string> = {
  mainnet: "Mainnet",
  testnet: "Testnet",
  unspecified: "Unspecified",
};
