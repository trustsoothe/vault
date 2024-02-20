import type { SupportedProtocols } from "@poktscan/keyring";
import type {
  BaseErrors,
  BaseExternalRequest,
  BaseProxyRequest,
  BaseProxyResponse,
  BaseResponse,
  RequestBeingHandledRes,
} from "./common";
import {
  ANSWER_SWITCH_CHAIN_REQUEST,
  ANSWER_SWITCH_CHAIN_RESPONSE,
  SWITCH_CHAIN_REQUEST,
  SWITCH_CHAIN_RESPONSE,
} from "../../constants/communication";
import {
  OperationRejected,
  RequestSwitchChainExists,
  UnrecognizedChainId,
} from "../../errors/communication";

export interface ProxySwitchChainReq extends BaseProxyRequest {
  type: typeof SWITCH_CHAIN_REQUEST;
  data: {
    chainId: string;
  };
}

export type ExternalSwitchChainReq = {
  type: typeof SWITCH_CHAIN_REQUEST;
  requestId: string;
  data: {
    protocol: SupportedProtocols;
    origin: string;
    chainId: string;
    faviconUrl: string;
  };
};

type ExternalSwitchChainErrors =
  | BaseErrors
  | typeof RequestSwitchChainExists
  | typeof UnrecognizedChainId
  | typeof OperationRejected;

export type ExternalSwitchChainRes = {
  type: typeof SWITCH_CHAIN_RESPONSE;
  requestId: string;
  data: null;
  error: ExternalSwitchChainErrors | null;
} | void;

export type ExternalSwitchChainResToProxy =
  | Extract<ExternalSwitchChainRes, { data: null }>
  | RequestBeingHandledRes;

export type InternalSwitchChainRes = Extract<
  ExternalSwitchChainRes,
  { data: null }
>;

export interface ProxyValidSwitchChainRes extends BaseProxyResponse {
  type: typeof SWITCH_CHAIN_RESPONSE;
  data: null;
  error: null;
}

export interface ProxyErrSwitchChainRes extends BaseProxyResponse {
  type: typeof SWITCH_CHAIN_RESPONSE;
  data: null;
  error: BaseErrors;
}

export type ProxySwitchChainRes =
  | ProxyValidSwitchChainRes
  | ProxyErrSwitchChainRes;

export type AppSwitchChainReq = BaseExternalRequest<
  typeof SWITCH_CHAIN_REQUEST
> &
  ExternalSwitchChainReq["data"];

export interface AnswerSwitchChainReq {
  type: typeof ANSWER_SWITCH_CHAIN_REQUEST;
  data: {
    accepted: boolean;
    request: AppSwitchChainReq;
  } | null;
}

export type AnswerSwitchChainRes = BaseResponse<
  typeof ANSWER_SWITCH_CHAIN_RESPONSE
>;
