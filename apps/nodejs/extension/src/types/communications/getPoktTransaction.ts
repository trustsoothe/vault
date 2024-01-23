import type { BaseErrors, BaseProxyRequest, BaseProxyResponse } from "./common";
import {
  GET_POKT_TRANSACTION_REQUEST,
  GET_POKT_TRANSACTION_RESPONSE,
} from "../../constants/communication";

export interface ProxyGetPoktTxReq extends BaseProxyRequest {
  type: typeof GET_POKT_TRANSACTION_REQUEST;
  data: {
    hash: string;
  };
}

export type ExternalGetPoktTxReq = {
  type: typeof GET_POKT_TRANSACTION_REQUEST;
  requestId: string;
  data: {
    origin: string;
    hash: string;
  };
};

export interface ExternalGetPoktTxRes {
  type: typeof GET_POKT_TRANSACTION_RESPONSE;
  requestId: string;
  data: {
    tx;
  } | null;
  error: BaseErrors | null;
}

export interface ProxyValidGetPoktTxRes extends BaseProxyResponse {
  type: typeof GET_POKT_TRANSACTION_RESPONSE;
  data;
  error: null;
}

export interface ProxyErrGetPoktTxRes extends BaseProxyResponse {
  type: typeof GET_POKT_TRANSACTION_RESPONSE;
  data: null;
  error: BaseErrors;
}

export type ProxyGetPoktTxRes = ProxyValidGetPoktTxRes | ProxyErrGetPoktTxRes;
