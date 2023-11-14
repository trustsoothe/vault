import type {
  SerializedAccountReference,
  SerializedSession,
} from "@poktscan/keyring";
import type { SupportedProtocols } from "@poktscan/keyring";
import type {
  TPermissionsAllowedToSuggest,
  TProtocol,
  TTransferRequestBody,
} from "../controllers/communication/Proxy";
import {
  CONNECTION_REQUEST_MESSAGE,
  CHECK_CONNECTION_REQUEST,
  NEW_ACCOUNT_REQUEST,
  TRANSFER_REQUEST,
  DISCONNECT_REQUEST,
  IS_SESSION_VALID_REQUEST,
  LIST_ACCOUNTS_REQUEST,
  REQUEST_BEING_HANDLED,
  CONNECTION_RESPONSE_MESSAGE,
  DISCONNECT_RESPONSE,
  IS_SESSION_VALID_RESPONSE,
  LIST_ACCOUNTS_RESPONSE,
  NEW_ACCOUNT_RESPONSE,
  TRANSFER_RESPONSE,
} from "../constants/communication";
import {
  AmountHigherThanBalance,
  AmountNotPresented,
  AmountNotValid,
  FeeLowerThanMinFee,
  FeeNotValid,
  ForbiddenSession,
  FromAddressNotPresented,
  FromAddressNotValid,
  InvalidBody,
  InvalidPermission,
  InvalidProtocol,
  InvalidSession,
  MemoNotValid,
  NotConnected,
  OperationRejected,
  OriginBlocked,
  OriginNotPresented,
  ProtocolNotPresented,
  RequestConnectionExists,
  RequestNewAccountExists,
  RequestTimeout,
  RequestTransferExists,
  SessionIdNotPresented,
  ToAddressNotPresented,
  ToAddressNotValid,
  UnknownError,
  VaultIsLocked,
} from "../errors/communication";

// EXTERNAL (used in redux)

type BaseExternalRequest<T extends string> = {
  type: T;
  tabId: number;
} & BaseExternalRequestBody;

type BaseExternalRequestWithSession<T extends string> = {
  type: T;
  tabId: number;
} & BaseExternalRequestBodyWithSession;

export type ExternalConnectionRequest = BaseExternalRequest<
  typeof CONNECTION_REQUEST_MESSAGE
> &
  ConnectionRequestMessage["data"];

export type ExternalNewAccountRequest = BaseExternalRequestWithSession<
  typeof NEW_ACCOUNT_REQUEST
> &
  NewAccountRequestMessage["data"];

export type ExternalTransferRequest = BaseExternalRequestWithSession<
  typeof TRANSFER_REQUEST
> &
  TransferRequestBody;

// Base

type TRequestBeingHandled = {
  type: typeof REQUEST_BEING_HANDLED;
};

export interface BaseProxyRequest {
  to: "VAULT_KEYRING";
}

interface BaseProxyResponse {
  from: "VAULT_KEYRING";
}

type BaseExternalRequestBody = {
  origin: string;
  faviconUrl: string;
  protocol: SupportedProtocols;
};

type BaseExternalRequestBodyWithSession = BaseExternalRequestBody & {
  sessionId: string;
};

export interface BaseRequestWithSession<T extends string> {
  type: T;
  data: {
    sessionId: string;
    origin: string;
  };
}

export type BaseErrors =
  | typeof OriginNotPresented
  | typeof OriginBlocked
  | typeof UnknownError;

export type RequestExistsError<T> = T extends typeof TRANSFER_RESPONSE
  ? typeof RequestTransferExists
  : T extends typeof CONNECTION_RESPONSE_MESSAGE
  ? typeof RequestConnectionExists
  : typeof RequestNewAccountExists;

// Connection

type ConnectionRequestErrors =
  | BaseErrors
  | typeof RequestConnectionExists
  | typeof RequestTimeout;

export interface ProxyConnectionRequest extends BaseProxyRequest {
  type: typeof CONNECTION_REQUEST_MESSAGE;
  data?: {
    suggestedPermissions?: TPermissionsAllowedToSuggest;
  };
}

export interface ConnectionRequestMessage {
  type: typeof CONNECTION_REQUEST_MESSAGE;
  data: BaseExternalRequestBody & {
    suggestedPermissions?: TPermissionsAllowedToSuggest;
  };
}

export type ExternalConnectionResponse = {
  data: null;
  error: ConnectionRequestErrors;
  type: typeof CONNECTION_RESPONSE_MESSAGE;
} | void;

export type PartialSession = Pick<
  SerializedSession,
  "id" | "createdAt" | "maxAge"
>;

export interface InternalConnectionResponse {
  type: typeof CONNECTION_RESPONSE_MESSAGE;
  data: { accepted: boolean; address: string; session: PartialSession } | null;
  error: null;
}

export type ExternalConnectionResOnProxy =
  | Extract<ExternalConnectionResponse, { data: null }>
  | TRequestBeingHandled;

export type ConnectionResponseFromBack =
  | Extract<ExternalConnectionResponse, { data: null }>
  | InternalConnectionResponse;

export interface ProxyValidConnectionRes extends BaseProxyResponse {
  type: typeof CONNECTION_RESPONSE_MESSAGE;
  data: string[];
  error: null;
}

export type ProxyConnectionErrors =
  | ConnectionRequestErrors
  | typeof InvalidPermission
  | typeof OperationRejected;

export interface ProxyErrConnectionRes extends BaseProxyResponse {
  type: typeof CONNECTION_RESPONSE_MESSAGE;
  data: null;
  error: ProxyConnectionErrors;
}

export type ProxyConnectionRes =
  | ProxyValidConnectionRes
  | ProxyErrConnectionRes;

// Session Is Valid
export type SessionValidRequestMessage = BaseRequestWithSession<
  typeof IS_SESSION_VALID_REQUEST
>;

export type IsSessionValidRequestErrors =
  | typeof SessionIdNotPresented
  | BaseErrors
  | null;

interface IsSessionValidResponse {
  type: typeof IS_SESSION_VALID_RESPONSE;
  data: {
    isValid: boolean;
  } | null;
  error: IsSessionValidRequestErrors;
}

// Check connection request

export interface ProxyCheckConnectionRequest extends BaseProxyRequest {
  type: typeof CHECK_CONNECTION_REQUEST;
  data?: undefined;
}

// New Account Request

export interface ProxyNewAccountRequest extends BaseProxyRequest {
  type: typeof NEW_ACCOUNT_REQUEST;
  data: {
    protocol: SupportedProtocols;
  };
}

export interface NewAccountData extends BaseExternalRequestBodyWithSession {
  protocol?: SupportedProtocols;
}

export interface NewAccountRequestMessage {
  type: typeof NEW_ACCOUNT_REQUEST;
  data: NewAccountData;
}

type ExternalNewAccountRequestErrors =
  | BaseErrors
  | typeof RequestTimeout
  | typeof SessionIdNotPresented
  | typeof InvalidSession
  | typeof ForbiddenSession
  | typeof RequestNewAccountExists;

export type ExternalNewAccountResponse = void | {
  type: typeof NEW_ACCOUNT_RESPONSE;
  data: null;
  error: ExternalNewAccountRequestErrors;
};

export interface InternalNewAccountResponse {
  type: typeof NEW_ACCOUNT_RESPONSE;
  data: {
    rejected: boolean;
    address: string | null;
    protocol: SupportedProtocols | null;
  };
  error: null;
}

export type ExternalNewAccountResOnProxy =
  | Extract<ExternalNewAccountResponse, { data: null }>
  | TRequestBeingHandled;

export type NewAccountResponseFromBack =
  | Extract<ExternalNewAccountResponse, { data: null }>
  | InternalNewAccountResponse;

export interface ProxyValidNewAccountRes extends BaseProxyResponse {
  type: typeof NEW_ACCOUNT_RESPONSE;
  data: {
    rejected: boolean;
    address: string | null;
    protocol: TProtocol;
  };
  error: null;
}

export type ProxyNewAccountRequestErrors =
  | ExternalNewAccountRequestErrors
  | typeof InvalidProtocol
  | typeof OperationRejected
  | typeof NotConnected;

export interface ProxyErrNewAccountRes extends BaseProxyResponse {
  type: typeof NEW_ACCOUNT_RESPONSE;
  data: null;
  error: ProxyNewAccountRequestErrors;
}

export type ProxyNewAccountRes =
  | ProxyValidNewAccountRes
  | ProxyErrNewAccountRes;

// Transfer Request

export type ExternalTransferErrors =
  | BaseErrors
  | typeof RequestTimeout
  | typeof SessionIdNotPresented
  | typeof FeeLowerThanMinFee
  | typeof InvalidSession
  | typeof ForbiddenSession
  | typeof RequestTransferExists
  | typeof AmountHigherThanBalance;

export type ProxyTransferError =
  | ExternalTransferErrors
  | typeof FeeNotValid
  | typeof AmountNotPresented
  | typeof ToAddressNotPresented
  | typeof FromAddressNotPresented
  | typeof NotConnected
  | typeof InvalidBody
  | typeof AmountNotValid
  | typeof FromAddressNotValid
  | typeof ToAddressNotValid
  | typeof MemoNotValid
  | typeof InvalidProtocol
  | typeof ProtocolNotPresented
  | typeof OperationRejected
  | null;

export interface ProxyTransferRequest extends BaseProxyRequest {
  type: typeof TRANSFER_REQUEST;
  data: TTransferRequestBody;
}

export type TransferRequestBody = BaseExternalRequestBodyWithSession &
  TTransferRequestBody;

export interface TransferRequestMessage {
  type: typeof TRANSFER_REQUEST;
  data: TransferRequestBody;
}

export type ExternalTransferResponse = void | {
  type: typeof TRANSFER_RESPONSE;
  data: null;
  error: ExternalTransferErrors;
};

export interface InternalTransferResponse {
  type: typeof TRANSFER_RESPONSE;
  data: {
    rejected: boolean;
    hash: string | null;
    protocol: SupportedProtocols | null;
  };
  error: null;
}

export type ExternalTransferResOnProxy =
  | Extract<ExternalTransferResponse, { data: null }>
  | TRequestBeingHandled;

export type TransferResponseFromBack =
  | Extract<ExternalTransferResponse, { data: null }>
  | InternalTransferResponse;

export interface ProxyValidTransferRes extends BaseProxyResponse {
  type: typeof TRANSFER_RESPONSE;
  data: {
    rejected: boolean;
    hash: string | null;
    protocol: TProtocol;
  };
  error: null;
}

export interface ProxyErrTransferRes extends BaseProxyResponse {
  type: typeof TRANSFER_RESPONSE;
  data: null;
  error: ProxyTransferError;
}

export type ProxyTransferRes = ProxyValidTransferRes | ProxyErrTransferRes;

// Disconnect

export interface ProxyDisconnectRequest extends BaseProxyRequest {
  type: typeof DISCONNECT_REQUEST;
  data?: undefined;
}

export type DisconnectRequestMessage = BaseRequestWithSession<
  typeof DISCONNECT_REQUEST
>;

export type ExternalDisconnectErrors =
  | BaseErrors
  | typeof InvalidSession
  | typeof ForbiddenSession
  | typeof SessionIdNotPresented;

export type ProxyDisconnectErrors =
  | ExternalDisconnectErrors
  | typeof RequestTimeout
  | typeof NotConnected;

export interface DisconnectBackResponse {
  type: typeof DISCONNECT_RESPONSE;
  data: {
    disconnected: true;
  } | null;
  error: ExternalDisconnectErrors | null;
}

export interface ProxyValidDisconnectRes extends BaseProxyResponse {
  type: typeof DISCONNECT_RESPONSE;
  data: {
    disconnected: true;
  };
  error: null;
}

export interface ProxyErrDisconnectRes extends BaseProxyResponse {
  type: typeof DISCONNECT_RESPONSE;
  data: null;
  error: ProxyDisconnectErrors;
}

export type ProxyDisconnectRes =
  | ProxyValidDisconnectRes
  | ProxyErrDisconnectRes;

// List Accounts

export interface ProxyListAccountsRequest extends BaseProxyRequest {
  type: typeof LIST_ACCOUNTS_REQUEST;
  data?: undefined;
}

export type ListAccountsRequestMessage = BaseRequestWithSession<
  typeof LIST_ACCOUNTS_REQUEST
>;

export interface AccountItem extends SerializedAccountReference {
  balance: number;
}

export type ExternalListAccountsErrors =
  | BaseErrors
  | typeof InvalidSession
  | typeof ForbiddenSession
  | typeof SessionIdNotPresented
  | typeof VaultIsLocked;

export type ProxyListAccountsErrors =
  | ExternalListAccountsErrors
  | typeof RequestTimeout
  | typeof NotConnected;

export interface ExternalListAccountsResponse {
  type: typeof LIST_ACCOUNTS_RESPONSE;
  data: {
    accounts: AccountItem[];
  } | null;
  error: ExternalListAccountsErrors | null;
}

export interface ProxyValidListAccountsRes extends BaseProxyResponse {
  type: typeof LIST_ACCOUNTS_RESPONSE;
  data: {
    accounts: AccountItem[];
  };
  error: null;
}

export interface ProxyErrListAccountsRes extends BaseProxyResponse {
  type: typeof ProxyListAccountsErrors;
  data: null;
  error: ProxyListAccountsErrors;
}

export type ProxyListAccountsRes =
  | ProxyValidListAccountsRes
  | ProxyErrListAccountsRes;
