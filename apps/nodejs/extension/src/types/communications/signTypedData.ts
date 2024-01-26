import type { SupportedProtocols } from "@poktscan/keyring";
import type { SignTypedData } from "../provider";
import type {
  BaseErrors,
  BaseExternalRequest,
  BaseProxyRequest,
  BaseProxyResponse,
  BaseResponse,
  RequestBeingHandledRes,
} from "./common";
import {
  ANSWER_SIGNED_TYPED_DATA_REQUEST,
  ANSWER_SIGNED_TYPED_DATA_RESPONSE,
  SIGN_TYPED_DATA_REQUEST,
  SIGN_TYPED_DATA_RESPONSE,
} from "../../constants/communication";
import {
  ChainIdIsNotActive,
  OperationRejected,
  RequestSignedTypedDataExists,
  RequestTimeout,
  SessionIdNotPresented,
  UnauthorizedError,
  UnauthorizedErrorSessionInvalid,
  UnknownError,
  UnrecognizedChainId,
} from "../../errors/communication";

export interface ProxySignTypedDataReq extends BaseProxyRequest {
  type: typeof SIGN_TYPED_DATA_REQUEST;
  data: {
    address: string;
    data: SignTypedData;
  };
}

export type ExternalSignTypedDataReq = {
  type: typeof SIGN_TYPED_DATA_REQUEST;
  requestId: string;
  data: {
    sessionId: string;
    protocol: SupportedProtocols;
    origin: string;
    faviconUrl: string;
    address: string;
    data: SignTypedData;
  };
};

type ExternalSignTypedDataErrors =
  | BaseErrors
  | typeof UnauthorizedError
  | typeof UnauthorizedErrorSessionInvalid
  | typeof RequestSignedTypedDataExists
  | typeof OperationRejected
  | typeof SessionIdNotPresented
  | typeof UnrecognizedChainId
  | typeof ChainIdIsNotActive;

export type ExternalSignTypedDataRes = {
  type: typeof SIGN_TYPED_DATA_RESPONSE;
  requestId: string;
  data: null;
  error: ExternalSignTypedDataErrors | null;
} | void;

export interface InternalSignedTypedDataRes {
  type: typeof SIGN_TYPED_DATA_RESPONSE;
  requestId: string;
  data: {
    sign: string;
  } | null;
  error: typeof UnknownError | typeof OperationRejected;
}

export type ExternalSignTypedDataResToProxy =
  | Extract<ExternalSignTypedDataRes, { data: null }>
  | RequestBeingHandledRes;

export type SignTypedDataResponseFromBack =
  | Extract<ExternalSignTypedDataRes, { data: null }>
  | InternalSignedTypedDataRes;

export type ProxySignedTypedDataErrors =
  | ExternalSignTypedDataErrors
  | typeof RequestTimeout;

export interface ProxyValidSignedTypedDataRes extends BaseProxyResponse {
  type: typeof SIGN_TYPED_DATA_RESPONSE;
  data: string;
  error: null;
}

export interface ProxyErrSignedTypedDataRes extends BaseProxyResponse {
  type: typeof SIGN_TYPED_DATA_RESPONSE;
  data: null;
  error: ProxySignedTypedDataErrors;
}

export type ProxySignedTypedDataRes =
  | ProxyValidSignedTypedDataRes
  | ProxyErrSignedTypedDataRes;

export type AppSignTypedDataReq = BaseExternalRequest<
  typeof SIGN_TYPED_DATA_REQUEST
> &
  ExternalSignTypedDataReq["data"] & { chainId: string };

export interface AnswerSignedTypedDataReq {
  type: typeof ANSWER_SIGNED_TYPED_DATA_REQUEST;
  data: {
    accepted: boolean;
    request: AppSignTypedDataReq;
  };
}

export type AnswerSignedTypedDataRes = BaseResponse<
  typeof ANSWER_SIGNED_TYPED_DATA_RESPONSE
>;
