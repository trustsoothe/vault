import type { SupportedProtocols } from "@poktscan/keyring";
import { OriginNotPresented, UnknownError } from "../../errors/communication";
import { REQUEST_BEING_HANDLED } from "../../constants/communication";

export interface BaseProxyRequest {
  to: "VAULT_KEYRING";
  protocol: SupportedProtocols;
  id: string;
}

export type BaseExternalRequestBody = {
  origin: string;
  faviconUrl: string;
  protocol: SupportedProtocols;
};

export type BaseExternalRequestBodyWithSession = BaseExternalRequestBody & {
  sessionId: string;
};

export type BaseExternalRequest<T extends string> = {
  type: T;
  requestId: string;
  tabId: number;
} & BaseExternalRequestBody;

export type BaseExternalRequestWithSession<T extends string> = {
  type: T;
  requestId: string;
  tabId: number;
} & BaseExternalRequestBodyWithSession;

export interface BaseRequestWithSession<T extends string> {
  type: T;
  data: {
    sessionId: string;
    origin: string;
  };
}

export type BaseErrors =
  | typeof OriginNotPresented
  | typeof OriginBlocked
  | typeof UnknownError;

export interface BaseProxyResponse {
  from: "VAULT_KEYRING";
  id: string;
}

export type RequestBeingHandledRes = {
  requestId: string;
  type: typeof REQUEST_BEING_HANDLED;
};

type UnknownErrorType = typeof UnknownError;
type BaseData = { answered: true };

type BaseResponse<
  T extends string,
  D extends BaseData = BaseData,
  E = UnknownErrorType
> = { type: T; data: D; error: null } | { type: T; data: null; error: E };
