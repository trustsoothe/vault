import type { SerializedSession, SupportedProtocols } from "@poktscan/vault";
import type {
  BaseProxyRequest,
  BaseExternalRequestBody,
  BaseErrors,
  BaseProxyResponse,
  RequestBeingHandledRes,
  BaseExternalRequest,
  BaseResponse,
} from "./common";
import {
  ANSWER_CONNECTION_REQUEST,
  ANSWER_CONNECTION_RESPONSE,
  CONNECTION_REQUEST_MESSAGE,
  CONNECTION_RESPONSE_MESSAGE,
} from "../../constants/communication";
import {
  OperationRejected,
  RequestConnectionExists,
  RequestTimeout,
} from "../../errors/communication";

export interface ProxyConnectionReq extends BaseProxyRequest {
  type: typeof CONNECTION_REQUEST_MESSAGE;
  data?: undefined;
}

export interface ExternalConnectionReq {
  type: typeof CONNECTION_REQUEST_MESSAGE;
  requestId: string;
  data: BaseExternalRequestBody;
}

type ConnectionReqErrors =
  | BaseErrors
  | typeof RequestConnectionExists
  | typeof RequestTimeout;

export type ExternalConnectionRes = {
  data: null;
  requestId: string;
  error: ConnectionReqErrors;
  type: typeof CONNECTION_RESPONSE_MESSAGE;
} | void;

export type PartialSession = Pick<
  SerializedSession,
  "id" | "createdAt" | "maxAge"
>;

export interface InternalConnectionRes {
  type: typeof CONNECTION_RESPONSE_MESSAGE;
  requestId: string;
  data: {
    accepted: boolean;
    addresses: string[];
    session: PartialSession;
    protocol: SupportedProtocols;
  } | null;
  error: null;
}

export type ExternalConnectionResToProxy =
  | Extract<ExternalConnectionRes, { data: null }>
  | RequestBeingHandledRes;

export interface ProxyValidConnectionRes extends BaseProxyResponse {
  type: typeof CONNECTION_RESPONSE_MESSAGE;
  data: string[];
  error: null;
}

export type ProxyConnectionErrors =
  | ConnectionReqErrors
  | typeof OperationRejected;

export interface ProxyErrConnectionRes extends BaseProxyResponse {
  type: typeof CONNECTION_RESPONSE_MESSAGE;
  data: null;
  error: ProxyConnectionErrors;
}

export type ProxyConnectionRes =
  | ProxyValidConnectionRes
  | ProxyErrConnectionRes;

export type AppConnectionRequest = BaseExternalRequest<
  typeof CONNECTION_REQUEST_MESSAGE
> &
  ExternalConnectionReq["data"];

export interface AnswerConnectionReq {
  type: typeof ANSWER_CONNECTION_REQUEST;
  data: {
    accepted: boolean;
    request: AppConnectionRequest;
    selectedAccounts: string[];
    protocol: SupportedProtocols;
  } | null;
}

export type AnswerConnectionRes = BaseResponse<
  typeof ANSWER_CONNECTION_RESPONSE
>;
