import type { SupportedProtocols } from "@soothe/vault";
import { SELECTED_ACCOUNT_CHANGED } from "../../constants/communication";

export interface AccountsChangedToProxy {
  type: typeof SELECTED_ACCOUNT_CHANGED;
  protocol: SupportedProtocols;
  data: {
    addresses: string[];
  };
}

export interface AccountsChangedToProvider extends AccountsChangedToProxy {
  from: "VAULT_KEYRING";
}
