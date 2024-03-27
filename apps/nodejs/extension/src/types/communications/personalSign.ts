import type { SupportedProtocols } from "@poktscan/vault";
import type {
  BaseErrors,
  BaseExternalRequest,
  BaseProxyRequest,
  BaseProxyResponse,
  BaseResponse,
  RequestBeingHandledRes,
} from "./common";
import {
  ANSWER_PERSONAL_SIGN_REQUEST,
  ANSWER_PERSONAL_SIGN_RESPONSE,
  PERSONAL_SIGN_REQUEST,
  PERSONAL_SIGN_RESPONSE,
} from "../../constants/communication";
import {
  OperationRejected,
  RequestPersonalSignExists,
  RequestTimeout,
  SessionIdNotPresented,
  UnauthorizedError,
  UnauthorizedErrorSessionInvalid,
  UnknownError,
} from "../../errors/communication";

export interface ProxyPersonalSignReq extends BaseProxyRequest {
  type: typeof PERSONAL_SIGN_REQUEST;
  data: {
    address: string;
    challenge: string;
  };
}

export type ExternalPersonalSignReq = {
  type: typeof PERSONAL_SIGN_REQUEST;
  requestId: string;
  data: {
    sessionId: string;
    protocol: SupportedProtocols;
    origin: string;
    faviconUrl: string;
    address: string;
    challenge: string;
  };
};

type ExternalPersonalSignErrors =
  | BaseErrors
  | typeof UnauthorizedError
  | typeof UnauthorizedErrorSessionInvalid
  | typeof RequestPersonalSignExists
  | typeof OperationRejected
  | typeof SessionIdNotPresented;

export type ExternalPersonalSignRes = {
  type: typeof PERSONAL_SIGN_RESPONSE;
  requestId: string;
  data: null;
  error: ExternalPersonalSignErrors | null;
} | void;

export type ExternalPersonalSignResToProxy =
  | Extract<ExternalPersonalSignRes, { data: null }>
  | RequestBeingHandledRes;

export interface InternalPersonalSignRes {
  type: typeof PERSONAL_SIGN_RESPONSE;
  requestId: string;
  data: {
    sign: string;
  } | null;
  error: typeof UnknownError | typeof OperationRejected;
}

export type ProxyPersonalSignErrors =
  | ExternalPersonalSignErrors
  | typeof RequestTimeout;

export interface ProxyValidPersonalSignRes extends BaseProxyResponse {
  type: typeof PERSONAL_SIGN_RESPONSE;
  data: string;
  error: null;
}

export interface ProxyErrPersonalSignRes extends BaseProxyResponse {
  type: typeof PERSONAL_SIGN_RESPONSE;
  data: null;
  error: ProxyPersonalSignErrors;
}

export type ProxyPersonalSignRes =
  | ProxyValidPersonalSignRes
  | ProxyErrPersonalSignRes;

export type AppPersonalSignReq = BaseExternalRequest<
  typeof PERSONAL_SIGN_REQUEST
> &
  ExternalPersonalSignReq["data"];

export interface AnswerPersonalSignReq {
  type: typeof ANSWER_PERSONAL_SIGN_REQUEST;
  data: {
    accepted: boolean;
    request: AppPersonalSignReq;
  };
}

export type AnswerPersonalSignRes = BaseResponse<
  typeof ANSWER_PERSONAL_SIGN_RESPONSE
>;
