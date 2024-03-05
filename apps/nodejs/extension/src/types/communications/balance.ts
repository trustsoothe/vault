import type { SupportedProtocols } from "@soothe/vault";
import type { GetAccountBalanceParam } from "../../redux/slices/app/network";
import type {
  BaseErrors,
  BaseProxyRequest,
  BaseProxyResponse,
  UnknownErrorType,
} from "./common";
import {
  ACCOUNT_BALANCE_REQUEST,
  ACCOUNT_BALANCE_RESPONSE,
  EXTERNAL_ACCOUNT_BALANCE_REQUEST,
  EXTERNAL_ACCOUNT_BALANCE_RESPONSE,
} from "../../constants/communication";
import {
  BlockNotSupported,
  propertyIsNotValid,
} from "../../errors/communication";

export interface ProxyBalanceReq extends BaseProxyRequest {
  type: typeof EXTERNAL_ACCOUNT_BALANCE_REQUEST;
  data: {
    address: string;
    protocol: SupportedProtocols;
    block?: string;
  };
}

export type ExternalBalanceReq = {
  type: typeof EXTERNAL_ACCOUNT_BALANCE_REQUEST;
  requestId: string;
  data: {
    origin: string;
    address: string;
    protocol: SupportedProtocols;
  };
};

export interface ExternalBalanceRes {
  type: typeof EXTERNAL_ACCOUNT_BALANCE_RESPONSE;
  requestId: string;
  data: {
    balance: number;
  } | null;
  error: BaseErrors | null;
}

export interface ProxyValidBalanceRes extends BaseProxyResponse {
  type: typeof EXTERNAL_ACCOUNT_BALANCE_RESPONSE;
  data: number;
  error: null;
}

export interface ProxyErrBalancesRes extends BaseProxyResponse {
  type: typeof EXTERNAL_ACCOUNT_BALANCE_RESPONSE;
  data: null;
  error:
    | BaseErrors
    | ReturnType<typeof propertyIsNotValid>
    | typeof BlockNotSupported;
}

export type ProxyBalanceRes = ProxyValidBalanceRes | ProxyErrBalancesRes;

export interface AccountBalanceReq {
  type: typeof ACCOUNT_BALANCE_REQUEST;
  data: GetAccountBalanceParam;
}

export interface AccountBalanceRes {
  type: typeof ACCOUNT_BALANCE_RESPONSE;
  data: {
    answered: true;
    balance: number;
  } | null;
  error: UnknownErrorType | null;
}
