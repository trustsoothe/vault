import {SupportedProtocols} from "@poktscan/vault";

export const getAccountPrefixByProtocol = (protocol: SupportedProtocols) => {
  switch (protocol) {
    case SupportedProtocols.Cosmos:
      return "pokt";
    default:
      return "";
  }
}
