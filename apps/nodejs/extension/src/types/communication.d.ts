import type {
  CONNECTION_REQUEST_MESSAGE,
  CHECK_CONNECTION_REQUEST,
  NEW_ACCOUNT_REQUEST,
  TRANSFER_REQUEST,
} from "../constants/communication";
import type {
  TPermissionsAllowedToSuggest,
  TTransferRequestBody,
} from "../controllers/communication/Proxy";
import {
  DISCONNECT_REQUEST,
  IS_SESSION_VALID_REQUEST,
  LIST_ACCOUNTS_REQUEST,
} from "../constants/communication";

// external

type BaseExternalRequestBody = {
  origin: string;
  faviconUrl: string;
};

export interface ConnectionRequestMessage {
  type: typeof CONNECTION_REQUEST_MESSAGE;
  data: BaseExternalRequestBody & {
    suggestedPermissions: TPermissionsAllowedToSuggest;
  };
}

export interface BaseRequestWithSession<T extends string> {
  type: T;
  data: {
    sessionId: string;
  };
}

export type SessionValidRequestMessage = BaseRequestWithSession<
  typeof IS_SESSION_VALID_REQUEST
>;

export type DisconnectRequestMessage = BaseRequestWithSession<
  typeof DISCONNECT_REQUEST
>;

export type ListAccountsRequestMessage = BaseRequestWithSession<
  typeof LIST_ACCOUNTS_REQUEST
>;

type BaseExternalRequestBodyWithSession = BaseExternalRequestBody & {
  sessionId: string;
};

export interface NewAccountRequestMessage {
  type: typeof NEW_ACCOUNT_REQUEST;
  data: BaseExternalRequestBodyWithSession;
}

export type TransferData = {
  fromAddress: string;
  toAddress: string;
  amount: number;
};

export type TransferRequestBody = BaseExternalRequestBodyWithSession &
  TransferData;

export interface TransferRequestMessage {
  type: typeof TRANSFER_REQUEST;
  data: TransferRequestBody;
}

// proxy requests

export interface BaseProxyRequest {
  to: "VAULT_KEYRING";
}

export interface ProxyConnectionRequest extends BaseProxyRequest {
  type: typeof CONNECTION_REQUEST_MESSAGE;
  suggestedPermissions?: TPermissionsAllowedToSuggest;
}

export interface ProxyCheckConnectionRequest extends BaseProxyRequest {
  type: typeof CHECK_CONNECTION_REQUEST;
}

export interface ProxyNewAccountRequest extends BaseProxyRequest {
  type: typeof NEW_ACCOUNT_REQUEST;
}

export interface ProxyTransferRequest extends BaseProxyRequest {
  type: typeof TRANSFER_REQUEST;
  data: TTransferRequestBody;
}

export interface ProxyDisconnectRequest extends BaseProxyRequest {
  type: typeof DISCONNECT_REQUEST;
}

export interface ProxyListAccountsRequest extends BaseProxyRequest {
  type: typeof LIST_ACCOUNTS_REQUEST;
}
