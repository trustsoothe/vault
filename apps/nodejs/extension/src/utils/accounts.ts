import {SupportedProtocols} from "@poktscan/vault";

export const getAccountPrefixByProtocol = (protocol: SupportedProtocols) => {
  switch (protocol) {
    case SupportedProtocols.PocketShannon:
      return "pokt";
    default:
      return "";
  }
}
