import type {
  SerializedAccountReference,
  SerializedSession,
} from "@poktscan/keyring";
import type { SupportedProtocols } from "@poktscan/keyring";
import type {
  TProtocol,
  TEthTransferBody,
  TPocketTransferBody,
} from "../controllers/communication/Proxy";
import type { SignTypedData } from "./provider";
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
  EXTERNAL_ACCOUNT_BALANCE_REQUEST,
  EXTERNAL_ACCOUNT_BALANCE_RESPONSE,
  SELECTED_CHAIN_REQUEST,
  SELECTED_CHAIN_RESPONSE,
  GET_POKT_TRANSACTION_REQUEST,
  GET_POKT_TRANSACTION_RESPONSE,
  SWITCH_CHAIN_REQUEST,
  SWITCH_CHAIN_RESPONSE,
  APP_IS_READY_REQUEST,
  APP_IS_READY_RESPONSE,
  SELECTED_ACCOUNT_CHANGED,
  SIGN_TYPED_DATA_REQUEST,
  SIGN_TYPED_DATA_RESPONSE,
  PERSONAL_SIGN_REQUEST,
  PERSONAL_SIGN_RESPONSE,
} from "../constants/communication";
import {
  AddressNotValid,
  AmountNotPresented,
  AmountNotValid,
  BlockNotSupported,
  FromAddressNotPresented,
  FromAddressNotValid,
  InvalidBody,
  InvalidProtocol,
  MemoNotValid,
  OperationRejected,
  OriginNotPresented,
  propertyIsNotValid,
  ProtocolNotPresented,
  RequestConnectionExists,
  RequestNewAccountExists,
  RequestPersonalSignExists,
  RequestSignedTypedDataExists,
  RequestSwitchChainExists,
  RequestTimeout,
  RequestTransferExists,
  SessionIdNotPresented,
  ToAddressNotPresented,
  ToAddressNotValid,
  UnauthorizedError,
  UnknownError,
  UnrecognizedChainId,
} from "../errors/communication";

// EXTERNAL (used in redux)

type BaseExternalRequest<T extends string> = {
  type: T;
  requestId: string;
  tabId: number;
} & BaseExternalRequestBody;

type BaseExternalRequestWithSession<T extends string> = {
  type: T;
  requestId: string;
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
  requestId: string;
  type: typeof REQUEST_BEING_HANDLED;
};

export interface BaseProxyRequest {
  to: "VAULT_KEYRING";
  network?: SupportedProtocols;
  id: string;
}

interface BaseProxyResponse {
  from: "VAULT_KEYRING";
  id: string;
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
  : T extends typeof NEW_ACCOUNT_RESPONSE
  ? typeof RequestNewAccountExists
  : T extends typeof SIGN_TYPED_DATA_RESPONSE
  ? typeof RequestSignedTypedDataExists
  : T extends typeof PERSONAL_SIGN_RESPONSE
  ? typeof RequestPersonalSignExists
  : typeof RequestSwitchChainExists;

// Connection

type ConnectionRequestErrors =
  | BaseErrors
  | typeof RequestConnectionExists
  | typeof RequestTimeout;

export interface ProxyConnectionRequest extends BaseProxyRequest {
  type: typeof CONNECTION_REQUEST_MESSAGE;
  data?: undefined;
}

export interface ConnectionRequestMessage {
  type: typeof CONNECTION_REQUEST_MESSAGE;
  requestId: string;
  data: BaseExternalRequestBody;
}

export type ExternalConnectionResponse = {
  data: null;
  requestId: string;
  error: ConnectionRequestErrors;
  type: typeof CONNECTION_RESPONSE_MESSAGE;
} | void;

export type PartialSession = Pick<
  SerializedSession,
  "id" | "createdAt" | "maxAge"
>;

export interface InternalConnectionResponse {
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
  requestId: string;
  data: NewAccountData;
}

type ExternalNewAccountRequestErrors =
  | BaseErrors
  | typeof RequestTimeout
  | typeof SessionIdNotPresented
  | typeof UnauthorizedError
  | typeof RequestNewAccountExists;

export type ExternalNewAccountResponse = void | {
  type: typeof NEW_ACCOUNT_RESPONSE;
  data: null;
  requestId: string;
  error: ExternalNewAccountRequestErrors;
};

export interface InternalNewAccountResponse {
  type: typeof NEW_ACCOUNT_RESPONSE;
  requestId: string;
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
  | typeof UnauthorizedError
  | typeof RequestTransferExists;

export type ProxyTransferError =
  | ExternalTransferErrors
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
  | ReturnType<typeof propertyIsNotValid>
  | null;

export interface ProxyTransferRequest extends BaseProxyRequest {
  type: typeof TRANSFER_REQUEST;
  data: TPocketTransferBody | TEthTransferBody;
}

export interface TransferRequestBody
  extends BaseExternalRequestBodyWithSession {
  transferData: (TPocketTransferBody | TEthTransferBody) & { chainId?: string };
}

export interface TransferRequestMessage {
  type: typeof TRANSFER_REQUEST;
  requestId: string;
  data: TransferRequestBody;
}

export type ExternalTransferResponse = void | {
  type: typeof TRANSFER_RESPONSE;
  requestId: string;
  data: null;
  error: ExternalTransferErrors;
};

export interface InternalTransferResponse {
  type: typeof TRANSFER_RESPONSE;
  requestId: string;
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
  data: string;
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
  | typeof UnauthorizedError
  | typeof SessionIdNotPresented;

export type ProxyDisconnectErrors =
  | ExternalDisconnectErrors
  | typeof RequestTimeout;

export interface DisconnectBackResponse {
  type: typeof DISCONNECT_RESPONSE;
  data: {
    disconnected: true;
    protocol: SupportedProtocols;
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

export type ListAccountsRequestMessage = {
  type: typeof LIST_ACCOUNTS_REQUEST;
  requestId: string;
  data: {
    sessionId: string;
    origin: string;
    protocol: SupportedProtocols;
  };
};

export interface AccountItem extends SerializedAccountReference {
  balance: number;
}

export type ExternalListAccountsErrors = BaseErrors;

export type ProxyListAccountsErrors = ExternalListAccountsErrors;

export interface ExternalListAccountsResponse {
  type: typeof LIST_ACCOUNTS_RESPONSE;
  requestId: string;
  data: {
    accounts: string[];
  } | null;
  error: ExternalListAccountsErrors | null;
}

export interface ProxyValidListAccountsRes extends BaseProxyResponse {
  type: typeof LIST_ACCOUNTS_RESPONSE;
  data: string[];
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

// get selected chain

export interface ProxySelectedChainRequest extends BaseProxyRequest {
  type: typeof SELECTED_CHAIN_REQUEST;
  data: {
    protocol: SupportedProtocols;
  };
}

export type SelectedChainRequestMessage = {
  type: typeof SELECTED_CHAIN_REQUEST;
  requestId: string;
  data: {
    origin: string;
    protocol: SupportedProtocols;
  };
};

export interface ExternalSelectedChainResponse {
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

// pokt_balance, eth_getBalance

export interface ProxyBalanceRequest extends BaseProxyRequest {
  type: typeof EXTERNAL_ACCOUNT_BALANCE_REQUEST;
  data: {
    address: string;
    protocol: SupportedProtocols;
    block?: string;
  };
}

export type BalanceRequestMessage = {
  type: typeof EXTERNAL_ACCOUNT_BALANCE_REQUEST;
  requestId: string;
  data: {
    origin: string;
    address: string;
    protocol: SupportedProtocols;
  };
};

export interface ExternalBalanceResponse {
  type: typeof EXTERNAL_ACCOUNT_BALANCE_RESPONSE;
  requestId: string;
  data: {
    balance: number;
  } | null;
  error: BaseErrors | null;
}

export interface ProxyValidBalanceRes extends BaseProxyResponse {
  type: typeof EXTERNAL_ACCOUNT_BALANCE_RESPONSE;
  data: number;
  error: null;
}

export interface ProxyErrBalancesRes extends BaseProxyResponse {
  type: typeof EXTERNAL_ACCOUNT_BALANCE_RESPONSE;
  data: null;
  error: BaseErrors | typeof AddressNotValid | typeof BlockNotSupported;
}

export type ProxyBalanceRes = ProxyValidBalanceRes | ProxyErrBalancesRes;

// get pokt transaction

export interface ProxyGetPoktTxRequest extends BaseProxyRequest {
  type: typeof GET_POKT_TRANSACTION_REQUEST;
  data: {
    hash: string;
  };
}

export type GetPoktTxRequestMessage = {
  type: typeof GET_POKT_TRANSACTION_REQUEST;
  requestId: string;
  data: {
    origin: string;
    hash: string;
  };
};

export interface ExternalGetPoktTxResponse {
  type: typeof GET_POKT_TRANSACTION_RESPONSE;
  requestId: string;
  data: {
    tx;
  } | null;
  error: BaseErrors | null;
}

export interface ProxyValidGetPoktTxRes extends BaseProxyResponse {
  type: typeof GET_POKT_TRANSACTION_RESPONSE;
  data;
  error: null;
}

export interface ProxyErrGetPoktTxRes extends BaseProxyResponse {
  type: typeof GET_POKT_TRANSACTION_RESPONSE;
  data: null;
  error: BaseErrors;
}

export type ProxyGetPoktTxRes = ProxyValidGetPoktTxRes | ProxyErrGetPoktTxRes;

// switch chain

export interface ProxySwitchChainRequest extends BaseProxyRequest {
  type: typeof SWITCH_CHAIN_REQUEST;
  data: {
    chainId: string;
  };
}

export type SwitchChainRequestMessage = {
  type: typeof SWITCH_CHAIN_REQUEST;
  requestId: string;
  data: {
    protocol: SupportedProtocols;
    origin: string;
    chainId: string;
    faviconUrl: string;
  };
};

export type ExternalSwitchChainRequest = BaseExternalRequest<
  typeof SWITCH_CHAIN_REQUEST
> &
  SwitchChainRequestMessage["data"];

type ExternalSwitchChainErrors =
  | BaseErrors
  | typeof RequestSwitchChainExists
  | typeof UnrecognizedChainId
  | typeof OperationRejected;

export type ExternalSwitchChainResponse = {
  type: typeof SWITCH_CHAIN_RESPONSE;
  requestId: string;
  data: null;
  error: ExternalSwitchChainErrors | null;
} | void;

export type ExternalSwitchChainResOnProxy =
  | Extract<ExternalSwitchChainResponse, { data: null }>
  | TRequestBeingHandled;

export type SwitchChainResponseFromBack = Extract<
  ExternalSwitchChainResponse,
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

// app is ready

export interface AppIsReadyRequest {
  type: typeof APP_IS_READY_REQUEST;
}

export interface AppIsReadyResponse {
  type: typeof APP_IS_READY_RESPONSE;
  data: {
    isReady: true;
    chainByProtocol: Partial<Record<SupportedProtocols, string>>;
  } | null;
  error?: typeof UnknownError | null;
}

// selected accounts changed

export interface AccountsChangedToProxy {
  type: typeof SELECTED_ACCOUNT_CHANGED;
  network: SupportedProtocols;
  data: {
    addresses: string[];
  };
}

export interface AccountsChangedToProvider extends AccountsChangedToProxy {
  to: "VAULT_KEYRING";
}

// sign typed data

export interface ProxySignTypedDataRequest extends BaseProxyRequest {
  type: typeof SIGN_TYPED_DATA_REQUEST;
  data: {
    address: string;
    data: SignTypedData;
  };
}

export type SignTypedDataRequestMessage = {
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

export type ExternalSignedTypedDataRequest = BaseExternalRequest<
  typeof SIGN_TYPED_DATA_REQUEST
> &
  SignTypedDataRequestMessage["data"] & { chainId: string };

type ExternalSignTypedDataErrors =
  | BaseErrors
  | typeof RequestSignedTypedDataExists
  | typeof OperationRejected
  | typeof SessionIdNotPresented
  | typeof UnrecognizedChainId;

export type ExternalSignTypedDataResponse = {
  type: typeof SIGN_TYPED_DATA_RESPONSE;
  requestId: string;
  data: null;
  error: ExternalSignTypedDataErrors | null;
} | void;

export interface InternalSignedTypedDataResponse {
  type: typeof SIGN_TYPED_DATA_RESPONSE;
  requestId: string;
  data: {
    sign: string;
  } | null;
  error: typeof UnknownError | typeof OperationRejected;
}

export type ExternalSignTypedDataResOnProxy =
  | Extract<ExternalSignTypedDataResponse, { data: null }>
  | TRequestBeingHandled;

export type SignTypedDataResponseFromBack =
  | Extract<ExternalSignTypedDataResponse, { data: null }>
  | InternalSignedTypedDataResponse;

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

// personal sign

export interface ProxyPersonalSignRequest extends BaseProxyRequest {
  type: typeof PERSONAL_SIGN_REQUEST;
  data: {
    address: string;
    challenge: string;
  };
}

export type PersonalSignRequestMessage = {
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

export type ExternalPersonalSignRequest = BaseExternalRequest<
  typeof PERSONAL_SIGN_REQUEST
> &
  PersonalSignRequestMessage["data"];

type ExternalPersonalSignErrors =
  | BaseErrors
  | typeof RequestPersonalSignExists
  | typeof OperationRejected
  | typeof SessionIdNotPresented;

export type ExternalPersonalSignResponse = {
  type: typeof PERSONAL_SIGN_RESPONSE;
  requestId: string;
  data: null;
  error: ExternalPersonalSignErrors | null;
} | void;

export interface InternalPersonalSignResponse {
  type: typeof PERSONAL_SIGN_RESPONSE;
  requestId: string;
  data: {
    sign: string;
  } | null;
  error: typeof UnknownError | typeof OperationRejected;
}

export type ExternalPersonalSignResOnProxy =
  | Extract<ExternalPersonalSignResponse, { data: null }>
  | TRequestBeingHandled;

export type PersonalSignResponseFromBack =
  | Extract<ExternalPersonalSignResponse, { data: null }>
  | InternalSignedTypedDataResponse;

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
