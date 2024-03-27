import type { SupportedProtocols } from "@poktscan/vault";
import {
  APP_IS_NOT_READY,
  APP_IS_READY,
  APP_IS_READY_REQUEST,
  APP_IS_READY_RESPONSE,
} from "../../constants/communication";
import { UnknownError } from "../../errors/communication";

export interface BackgroundAppIsReadyReq {
  type: typeof APP_IS_READY_REQUEST;
}

export interface BackgroundAppIsReadyRes {
  type: typeof APP_IS_READY_RESPONSE;
  data: {
    isReady: true;
    chainByProtocol: Partial<Record<SupportedProtocols, string>>;
  } | null;
  error?: typeof UnknownError | null;
}

export interface AppIsReadyMessageToProvider {
  type: typeof APP_IS_READY | typeof APP_IS_NOT_READY;
  from: "VAULT_KEYRING";
  protocol: SupportedProtocols;
  data: {
    chainId: string;
  };
  id?: string;
  error?: null;
}
