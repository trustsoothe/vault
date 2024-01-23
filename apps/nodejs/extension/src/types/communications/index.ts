import type {
  AnswerConnectionReq,
  AppConnectionRequest,
  ExternalConnectionReq,
  ExternalConnectionRes,
  InternalConnectionRes,
  ProxyConnectionReq,
  ProxyConnectionRes,
} from "./connection";
import type {
  AnswerTransferReq,
  AppTransferReq,
  ExternalTransferReq,
  InternalTransferRes,
  ProxyTransferReq,
  ProxyTransferRes,
} from "./transfer";
import type {
  ExternalListAccountsReq,
  ProxyListAccountsReq,
  ProxyListAccountsRes,
} from "./listAccounts";
import type {
  AccountBalanceReq,
  ExternalBalanceReq,
  ProxyBalanceReq,
  ProxyBalanceRes,
} from "./balance";
import type {
  ExternalSelectedChainReq,
  ProxySelectedChainReq,
  ProxySelectedChainRes,
} from "./selectedChain";
import type {
  ExternalGetPoktTxReq,
  ProxyGetPoktTxReq,
  ProxyGetPoktTxRes,
} from "./getPoktTransaction";
import type {
  AnswerSwitchChainReq,
  AppSwitchChainReq,
  ExternalSwitchChainReq,
  InternalSwitchChainRes,
  ProxySwitchChainReq,
  ProxySwitchChainRes,
} from "./switchChain";
import type {
  AnswerSignedTypedDataReq,
  AppSignTypedDataReq,
  ExternalSignTypedDataReq,
  InternalSignedTypedDataRes,
  ProxySignedTypedDataRes,
  ProxySignTypedDataReq,
} from "./signTypedData";
import type {
  AnswerPersonalSignReq,
  AppPersonalSignReq,
  ExternalPersonalSignReq,
  InternalPersonalSignRes,
  ProxyPersonalSignReq,
  ProxyPersonalSignRes,
} from "./personalSign";
import type { InternalDisconnectRes } from "./disconnect";
import type { ChainChangedMessageToProxy } from "./chainChanged";
import type { AccountsChangedToProxy } from "./accountChanged";
import type { AppIsReadyMessageToProvider } from "./appIsReady";
import {
  CONNECTION_RESPONSE_MESSAGE,
  PERSONAL_SIGN_RESPONSE,
  SIGN_TYPED_DATA_RESPONSE,
  TRANSFER_RESPONSE,
} from "../../constants/communication";
import {
  RequestConnectionExists,
  RequestPersonalSignExists,
  RequestSignedTypedDataExists,
  RequestSwitchChainExists,
  RequestTransferExists,
} from "../../errors/communication";
import type { ExternalIsSessionValidReq } from "./sessionIsValid";
import type {
  CheckPermissionForSessionReq,
  ExportVaultReq,
  ImportAccountReq,
  ImportVaultReq,
  InitializeVaultReq,
  LockVaultReq,
  PrivateKeyAccountReq,
  RemoveAccountReq,
  RevokeExternalSessionsReq,
  RevokeSessionReq,
  ShouldExportVaultReq,
  UnlockVaultReq,
  UpdateAccountReq,
} from "./vault";
import type { NetworkFeeReq, SetRequirePasswordForOptsReq } from "./app";
import type { AnswerNewAccountReq } from "./newAccount";

export type ProxyRequests =
  | ProxyConnectionReq
  | ProxyTransferReq
  | ProxyListAccountsReq
  | ProxyBalanceReq
  | ProxySelectedChainReq
  | ProxyGetPoktTxReq
  | ProxySwitchChainReq
  | ProxySignTypedDataReq
  | ProxyPersonalSignReq;
export type ProxyResponses =
  | ProxyConnectionRes
  | ProxySelectedChainRes
  | ProxyBalanceRes
  | ProxyListAccountsRes
  | ProxyTransferRes
  | ProxyGetPoktTxRes
  | ProxySwitchChainRes
  | ProxySignedTypedDataRes
  | ProxyPersonalSignRes
  | AppIsReadyMessageToProvider;

export type ExternalRequests =
  | ExternalConnectionReq
  | ExternalIsSessionValidReq
  | ExternalTransferReq
  | ExternalSwitchChainReq
  | ExternalListAccountsReq
  | ExternalBalanceReq
  | ExternalSelectedChainReq
  | ExternalGetPoktTxReq
  | ExternalSignTypedDataReq
  | ExternalPersonalSignReq;
export type ExternalResponses = ExternalConnectionRes;

export type InternalRequests =
  | AnswerConnectionReq
  | AnswerNewAccountReq
  | AnswerTransferReq
  | InitializeVaultReq
  | UnlockVaultReq
  | LockVaultReq
  | RevokeSessionReq
  | UpdateAccountReq
  | RemoveAccountReq
  | ImportAccountReq
  | PrivateKeyAccountReq
  | RevokeExternalSessionsReq
  | AccountBalanceReq
  | NetworkFeeReq
  | CheckPermissionForSessionReq
  | AnswerSwitchChainReq
  | AnswerSignedTypedDataReq
  | AnswerPersonalSignReq
  | ExportVaultReq
  | ShouldExportVaultReq
  | ImportVaultReq
  | SetRequirePasswordForOptsReq;
/**Responses that the Proxy can receive from Internal controller */
export type InternalResponses =
  | InternalConnectionRes
  | InternalTransferRes
  | InternalDisconnectRes
  | InternalSwitchChainRes
  | InternalSignedTypedDataRes
  | InternalPersonalSignRes
  | ChainChangedMessageToProxy
  | AccountsChangedToProxy;

export type UiResponsesToProxy =
  | InternalConnectionRes
  | InternalTransferRes
  | InternalSwitchChainRes
  | InternalPersonalSignRes
  | InternalSignedTypedDataRes;

export type AppRequests = (
  | AppConnectionRequest
  | AppTransferReq
  | AppSwitchChainReq
  | AppSignTypedDataReq
  | AppPersonalSignReq
) & { requestedAt?: number };

export type RequestExistsError<T> = T extends typeof TRANSFER_RESPONSE
  ? typeof RequestTransferExists
  : T extends typeof CONNECTION_RESPONSE_MESSAGE
  ? typeof RequestConnectionExists
  : T extends typeof SIGN_TYPED_DATA_RESPONSE
  ? typeof RequestSignedTypedDataExists
  : T extends typeof PERSONAL_SIGN_RESPONSE
  ? typeof RequestPersonalSignExists
  : typeof RequestSwitchChainExists;
