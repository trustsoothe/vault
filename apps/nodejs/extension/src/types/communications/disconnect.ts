import type { SupportedProtocols } from "@poktscan/keyring";
import { DISCONNECT_RESPONSE } from "../../constants/communication";

export interface InternalDisconnectRes {
  type: typeof DISCONNECT_RESPONSE;
  data: {
    disconnected: true;
    protocol: SupportedProtocols;
  } | null;
  error: null;
}
