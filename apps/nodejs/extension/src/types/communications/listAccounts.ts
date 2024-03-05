import type { SupportedProtocols } from "@soothe/vault";
import type { BaseErrors, BaseProxyRequest, BaseProxyResponse } from "./common";
import {
  LIST_ACCOUNTS_REQUEST,
  LIST_ACCOUNTS_RESPONSE,
} from "../../constants/communication";

export interface ProxyListAccountsReq extends BaseProxyRequest {
  type: typeof LIST_ACCOUNTS_REQUEST;
  data?: undefined;
}

export type ExternalListAccountsReq = {
  type: typeof LIST_ACCOUNTS_REQUEST;
  requestId: string;
  data: {
    sessionId: string;
    origin: string;
    protocol: SupportedProtocols;
  };
};

export type ExternalListAccountsErrors = BaseErrors;

export interface ExternalListAccountsRes {
  type: typeof LIST_ACCOUNTS_RESPONSE;
  requestId: string;
  data: {
    accounts: string[];
  } | null;
  error: ExternalListAccountsErrors | null;
}

export interface ProxyValidListAccountsRes extends BaseProxyResponse {
  type: typeof LIST_ACCOUNTS_RESPONSE;
  data: string[];
  error: null;
}

export type ProxyListAccountsErrors = ExternalListAccountsErrors;

export interface ProxyErrListAccountsRes extends BaseProxyResponse {
  type: typeof LIST_ACCOUNTS_RESPONSE;
  data: null;
  error: ProxyListAccountsErrors;
}

export type ProxyListAccountsRes =
  | ProxyValidListAccountsRes
  | ProxyErrListAccountsRes;
