import type { SupportedProtocols } from "@soothe/vault";
import type {
  BaseErrors,
  BaseExternalRequest,
  BaseProxyRequest,
  BaseProxyResponse,
  BaseResponse,
  RequestBeingHandledRes,
} from "./common";
import {
  ANSWER_BULK_PERSONAL_SIGN_REQUEST,
  ANSWER_BULK_PERSONAL_SIGN_RESPONSE,
  ANSWER_PERSONAL_SIGN_REQUEST,
  ANSWER_PERSONAL_SIGN_RESPONSE,
  BULK_PERSONAL_SIGN_REQUEST,
  BULK_PERSONAL_SIGN_RESPONSE,
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

// ###

export interface ProxyBulkPersonalSignReq extends BaseProxyRequest {
  type: typeof BULK_PERSONAL_SIGN_REQUEST;
  data: {
    address: string;
    challenges: Array<{
      id?: string;
      challenge: string;
    }>;
  };
}

export type ExternalBulkPersonalSignReq = {
  type: typeof BULK_PERSONAL_SIGN_REQUEST;
  requestId: string;
  data: {
    sessionId: string;
    protocol: SupportedProtocols;
    origin: string;
    faviconUrl: string;
    address: string;
    challenges: Array<{
      id?: string;
      challenge: string;
    }>;
  };
};

type ExternalBulkPersonalSignErrors =
  | BaseErrors
  | typeof UnauthorizedError
  | typeof UnauthorizedErrorSessionInvalid
  | typeof RequestPersonalSignExists
  | typeof OperationRejected
  | typeof SessionIdNotPresented;

export type ExternalBulkPersonalSignRes = {
  type: typeof BULK_PERSONAL_SIGN_RESPONSE;
  requestId: string;
  data: null;
  error: ExternalBulkPersonalSignErrors | null;
} | void;

export type ExternalBulkPersonalSignResToProxy =
  | Extract<ExternalBulkPersonalSignRes, { data: null }>
  | RequestBeingHandledRes;

export interface InternalBulkPersonalSignRes {
  type: typeof BULK_PERSONAL_SIGN_RESPONSE;
  requestId: string;
  data: {
    signatures: Array<{
      id?: string;
      signature: string;
    }>;
  } | null;
  error: typeof UnknownError | typeof OperationRejected;
}

export type ProxyBulkPersonalSignErrors =
  | ExternalBulkPersonalSignErrors
  | typeof RequestTimeout;

export interface ProxyValidBulkPersonalSignRes extends BaseProxyResponse {
  type: typeof BULK_PERSONAL_SIGN_RESPONSE;
  data: Array<{
    id?: string;
    signature: string;
  }>;
  error: null;
}

export interface ProxyErrBulkPersonalSignRes extends BaseProxyResponse {
  type: typeof BULK_PERSONAL_SIGN_RESPONSE;
  data: null;
  error: ProxyBulkPersonalSignErrors;
}

export type ProxyBulkPersonalSignRes =
  | ProxyValidBulkPersonalSignRes
  | ProxyErrBulkPersonalSignRes;

export type AppBulkPersonalSignReq = BaseExternalRequest<
  typeof BULK_PERSONAL_SIGN_REQUEST
> &
  ExternalBulkPersonalSignReq["data"];

export interface AnswerBulkPersonalSignReq {
  type: typeof ANSWER_BULK_PERSONAL_SIGN_REQUEST;
  data: {
    accepted: boolean;
    request: AppBulkPersonalSignReq;
  };
}

export type AnswerBulkPersonalSignRes = BaseResponse<
  typeof ANSWER_BULK_PERSONAL_SIGN_RESPONSE
>;
