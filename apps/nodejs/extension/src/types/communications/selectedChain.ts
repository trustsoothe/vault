import type { SupportedProtocols } from "@poktscan/keyring";
import type { BaseErrors, BaseProxyRequest, BaseProxyResponse } from "./common";
import {
  SELECTED_CHAIN_REQUEST,
  SELECTED_CHAIN_RESPONSE,
} from "../../constants/communication";

export interface ProxySelectedChainReq extends BaseProxyRequest {
  type: typeof SELECTED_CHAIN_REQUEST;
  data: {
    protocol: SupportedProtocols;
  };
}

export type ExternalSelectedChainReq = {
  type: typeof SELECTED_CHAIN_REQUEST;
  requestId: string;
  data: {
    origin: string;
    protocol: SupportedProtocols;
  };
};

export interface ExternalSelectedChainRes {
  type: typeof SELECTED_CHAIN_RESPONSE;
  requestId: string;
  data: {
    chainId: string;
  } | null;
  error: BaseErrors | null;
}

export interface ProxyValidSelectedChainRes extends BaseProxyResponse {
  type: typeof SELECTED_CHAIN_RESPONSE;
  data: string;
  error: null;
}

export interface ProxyErrSelectedChainRes extends BaseProxyResponse {
  type: typeof SELECTED_CHAIN_RESPONSE;
  data: null;
  error: BaseErrors;
}

export type ProxySelectedChainRes =
  | ProxyValidSelectedChainRes
  | ProxyErrSelectedChainRes;
