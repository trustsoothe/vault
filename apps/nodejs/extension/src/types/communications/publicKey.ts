import type { SupportedProtocols } from "@poktscan/vault";
import type { BaseErrors, BaseProxyRequest, BaseProxyResponse } from "./common";
import { propertyIsNotValid } from "../../errors/communication";
import {
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

export interface ExternalPublicKeyRes {
  type: typeof PUBLIC_KEY_RESPONSE;
  requestId: string;
  data: {
    publicKey: string;
  } | null;
  error: BaseErrors | null;
}

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
