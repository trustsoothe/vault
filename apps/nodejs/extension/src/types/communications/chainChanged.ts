import type { SupportedProtocols } from "@poktscan/keyring";
import { SELECTED_CHAIN_CHANGED } from "../../constants/communication";

export interface ChainChangedMessageToProxy {
  type: typeof SELECTED_CHAIN_CHANGED;
  protocol: SupportedProtocols;
  data: {
    chainId: string;
  };
}

export interface ChainChangedToProvider extends ChainChangedMessageToProxy {
  from: "VAULT_KEYRING";
}
