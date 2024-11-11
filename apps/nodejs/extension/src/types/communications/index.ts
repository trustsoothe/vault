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
  RemoveRecoveryPhraseReq,
  RevokeExternalSessionsReq,
  RevokeSessionReq,
  ShouldExportVaultReq,
  UnlockVaultReq,
  UpdateAccountReq,
  UpdateRecoveryPhraseReq,
} from "./vault";
import type { NetworkFeeReq, SetRequirePasswordForOptsReq } from "./app";
import type { AnswerNewAccountReq } from "./newAccount";
import {
  CreateAccountFromHdSeedReq,
  GetRecoveryPhraseIdReq,
  ImportHdWalletReq,
} from "./hdWallet";
import {
  AnswerChangeParamReq,
  AnswerDaoTransferReq,
  AnswerStakeAppReq,
  AnswerStakeNodeReq,
  AnswerTransferAppReq,
  AnswerUnjailNodeReq,
  AnswerUnstakeAppReq,
  AnswerUnstakeNodeReq,
  AnswerUpgradeReq,
  AnswerValidatePoktTxReq,
  AppChangeParamReq,
  AppDaoTransferReq,
  AppStakeAppReq,
  AppStakeNodeReq,
  AppTransferAppReq,
  AppUnjailNodeReq,
  AppUnstakeAppReq,
  AppUnstakeNodeReq,
  AppUpgradeReq,
  ExternalChangeParamReq,
  ExternalDaoTransferReq,
  ExternalStakeAppReq,
  ExternalStakeNodeReq,
  ExternalTransferAppReq,
  ExternalUnjailNodeReq,
  ExternalUnstakeAppReq,
  ExternalUnstakeNodeReq,
  ExternalUpgradeReq,
  InternalChangeParamRes,
  InternalDaoTransferRes,
  InternalStakeAppRes,
  InternalStakeNodeRes,
  InternalTransferAppRes,
  InternalUnjailNodeRes,
  InternalUnstakeAppRes,
  InternalUnstakeNodeRes,
  InternalUpgradeRes,
  ProxyChangeParamReq,
  ProxyChangeParamRes,
  ProxyDaoTransferReq,
  ProxyDaoTransferRes,
  ProxyStakeAppReq,
  ProxyStakeAppRes,
  ProxyStakeNodeReq,
  ProxyStakeNodeRes,
  ProxyTransferAppReq,
  ProxyTransferAppRes,
  ProxyUnjailNodeReq,
  ProxyUnjailNodeRes,
  ProxyUnstakeAppReq,
  ProxyUnstakeAppRes,
  ProxyUnstakeNodeReq,
  ProxyUnstakeNodeRes,
  ProxyUpgradeReq,
  ProxyUpgradeRes,
} from "./transactions";
import {
  AnswerPublicKeyReq,
  AppPublicKeyReq,
  ExternalPublicKeyReq,
  InternalPublicKeyRes,
  ProxyPublicKeyReq,
  ProxyPublicKeyRes,
} from "./publicKey";

export type ProxyRequests =
  | ProxyConnectionReq
  | ProxyTransferReq
  | ProxyListAccountsReq
  | ProxyBalanceReq
  | ProxySelectedChainReq
  | ProxyGetPoktTxReq
  | ProxySwitchChainReq
  | ProxySignTypedDataReq
  | ProxyPersonalSignReq
  | ProxyStakeNodeReq
  | ProxyUnstakeNodeReq
  | ProxyUnjailNodeReq
  | ProxyStakeAppReq
  | ProxyTransferAppReq
  | ProxyUnstakeAppReq
  | ProxyChangeParamReq
  | ProxyDaoTransferReq
  | ProxyPublicKeyReq
  | ProxyUpgradeReq;
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
  | AppIsReadyMessageToProvider
  | ProxyPublicKeyRes
  | ProxyStakeNodeRes
  | ProxyUnjailNodeRes
  | ProxyStakeAppRes
  | ProxyTransferAppRes
  | ProxyUnstakeAppRes
  | ProxyChangeParamRes
  | ProxyDaoTransferRes
  | ProxyUpgradeRes
  | ProxyUnstakeNodeRes;

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
  | ExternalPersonalSignReq
  | ExternalPublicKeyReq
  | ExternalStakeNodeReq
  | ExternalUnjailNodeReq
  | ExternalStakeAppReq
  | ExternalTransferAppReq
  | ExternalUnstakeAppReq
  | ExternalDaoTransferReq
  | ExternalChangeParamReq
  | ExternalUnstakeNodeReq
  | ExternalUpgradeReq;
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
  | ImportHdWalletReq
  | CreateAccountFromHdSeedReq
  | PrivateKeyAccountReq
  | RevokeExternalSessionsReq
  | NetworkFeeReq
  | CheckPermissionForSessionReq
  | AnswerSwitchChainReq
  | AnswerSignedTypedDataReq
  | AnswerPersonalSignReq
  | AnswerPublicKeyReq
  | ExportVaultReq
  | ShouldExportVaultReq
  | ImportVaultReq
  | SetRequirePasswordForOptsReq
  | UpdateRecoveryPhraseReq
  | RemoveRecoveryPhraseReq
  | GetRecoveryPhraseIdReq
  | AnswerUnstakeNodeReq
  | AnswerStakeNodeReq
  | AnswerUnjailNodeReq
  | AnswerStakeAppReq
  | AnswerTransferAppReq
  | AnswerUnstakeAppReq
  | AnswerChangeParamReq
  | AnswerDaoTransferReq
  | AnswerUpgradeReq
  | AnswerValidatePoktTxReq;
/**Responses that the Proxy can receive from Internal controller */
export type InternalResponses =
  | InternalConnectionRes
  | InternalTransferRes
  | InternalDisconnectRes
  | InternalSwitchChainRes
  | InternalSignedTypedDataRes
  | InternalPersonalSignRes
  | ChainChangedMessageToProxy
  | AccountsChangedToProxy
  | InternalStakeNodeRes
  | InternalUnstakeNodeRes
  | InternalUnjailNodeRes
  | InternalStakeAppRes
  | InternalTransferAppRes
  | InternalUnstakeAppRes
  | InternalChangeParamRes
  | InternalDaoTransferRes
  | InternalUpgradeRes
  | InternalPublicKeyRes;

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
  | AppPublicKeyReq
  | AppStakeNodeReq
  | AppUnstakeNodeReq
  | AppUnjailNodeReq
  | AppStakeAppReq
  | AppTransferAppReq
  | AppUnstakeAppReq
  | AppChangeParamReq
  | AppDaoTransferReq
  | AppUpgradeReq
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
