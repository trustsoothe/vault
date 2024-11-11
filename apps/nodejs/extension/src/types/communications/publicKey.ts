import type { SupportedProtocols } from "@poktscan/vault";
import type {
  BaseErrors,
  BaseExternalRequest,
  BaseProxyRequest,
  BaseProxyResponse,
  RequestBeingHandledRes,
} from "./common";
import {
  OperationRejected,
  propertyIsNotValid,
  UnknownError,
} from "../../errors/communication";
import {
  ANSWER_PUBLIC_KEY_REQUEST,
  PUBLIC_KEY_REQUEST,
  PUBLIC_KEY_RESPONSE,
} from "../../constants/communication";

export interface ProxyPublicKeyReq extends BaseProxyRequest {
  type: typeof PUBLIC_KEY_REQUEST;
  data: {
    address: string;
  };
}

export type ExternalPublicKeyReq = {
  type: typeof PUBLIC_KEY_REQUEST;
  requestId: string;
  data: {
    sessionId: string;
    protocol: SupportedProtocols;
    origin: string;
    address: string;
    faviconUrl: string;
  };
};

export type ExternalPublicKeyRes = {
  type: typeof PUBLIC_KEY_RESPONSE;
  requestId: string;
  data: {
    publicKey: string;
  } | null;
  error: BaseErrors | null;
} | void;

export type ExternalPublicKeyResToProxy =
  | Extract<ExternalPublicKeyRes, { data: { publicKey: string } }>
  | RequestBeingHandledRes;

export type InternalPublicKeyRes = {
  type: typeof PUBLIC_KEY_RESPONSE;
  requestId: string;
  data: {
    publicKey: string;
  } | null;
  error: typeof UnknownError | typeof OperationRejected;
};

export type AppPublicKeyReq = BaseExternalRequest<typeof PUBLIC_KEY_REQUEST> &
  ExternalPublicKeyReq["data"];

export type AnswerPublicKeyReq = {
  type: typeof ANSWER_PUBLIC_KEY_REQUEST;
  data: {
    request: AppPublicKeyReq;
  };
};

export interface ProxyValidPublicKeyRes extends BaseProxyResponse {
  type: typeof PUBLIC_KEY_RESPONSE;
  data: { publicKey: string };
  error: null;
}

export interface ProxyErrPublicKeyRes extends BaseProxyResponse {
  type: typeof PUBLIC_KEY_RESPONSE;
  data: null;
  error: BaseErrors | ReturnType<typeof propertyIsNotValid>;
}

export type ProxyPublicKeyRes = ProxyValidPublicKeyRes | ProxyErrPublicKeyRes;
