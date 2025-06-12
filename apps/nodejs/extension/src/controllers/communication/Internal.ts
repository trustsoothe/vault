import type {
  AnswerPublicKeyReq,
  InternalPublicKeyRes,
} from "../../types/communications/publicKey";
import type { AppRequests, InternalRequests } from "../../types/communications";
import type {
  AnswerTransferReq,
  AnswerTransferRes,
  InternalTransferRes,
} from "../../types/communications/transfer";
import type {
  AnswerConnectionReq,
  AnswerConnectionRes,
  InternalConnectionRes,
} from "../../types/communications/connection";
import type {
  AnswerSwitchChainReq,
  AnswerSwitchChainRes,
  ExternalSwitchChainRes,
  InternalSwitchChainRes,
} from "../../types/communications/switchChain";
import type {
  AnswerSignedTypedDataReq,
  AnswerSignedTypedDataRes,
  ExternalSignTypedDataRes,
  InternalSignedTypedDataRes,
} from "../../types/communications/signTypedData";
import type {
  AnswerBulkPersonalSignReq,
  AnswerBulkPersonalSignRes,
  AnswerPersonalSignReq,
  AnswerPersonalSignRes,
  InternalBulkPersonalSignRes,
  InternalPersonalSignRes,
} from "../../types/communications/personalSign";
import type {
  CheckPermissionForSessionReq,
  CheckPermissionForSessionRes,
  ExportVaultReq,
  ExportVaultRes,
  ImportAccountReq,
  ImportAccountRes,
  ImportVaultReq,
  ImportVaultRes,
  InitializeVaultReq,
  InitializeVaultRes,
  LockVaultRes,
  PrivateKeyAccountReq,
  PrivateKeyAccountRes,
  RemoveAccountReq,
  RemoveAccountRes,
  RemoveRecoveryPhraseReq,
  RemoveRecoveryPhraseRes,
  RevokeExternalSessionsRes,
  RevokeSessionRes,
  ShouldExportVaultRes,
  UnlockVaultReq,
  UnlockVaultRes,
  UpdateAccountReq,
  UpdateAccountRes,
  UpdateRecoveryPhraseReq,
  UpdateRecoveryPhraseRes,
} from "../../types/communications/vault";
import type {
  AnswerNewAccountReq,
  AnswerNewAccountRes,
} from "../../types/communications/newAccount";
import type {
  NetworkFeeReq,
  NetworkFeeRes,
  SetRequirePasswordForOptsReq,
  SetRequirePasswordForOptsRes,
} from "../../types/communications/app";
import type { ICommunicationController } from "../../types";
import type {
  CreateAccountFromHdSeedReq,
  CreateAccountFromHdSeedRes,
  GetRecoveryPhraseIdReq,
  GetRecoveryPhraseIdRes,
  ImportHdWalletReq,
  ImportHdWalletRes,
} from "../../types/communications/hdWallet";
import type {
  AnswerBasePoktTxResponseData,
  AnswerBulkSignTransactionReq,
  AnswerBulkSignTransactionRes,
  AnswerPoktTxRequests,
  AnswerValidatePoktTxReq,
  AnswerValidatePoktTxRes,
  InternalBulkSignTransactionRes,
  InternalChangeParamRes,
  InternalDaoTransferRes,
  InternalResponse,
  InternalStakeAppRes,
  InternalStakeNodeRes,
  InternalTransferAppRes,
  InternalUnjailNodeRes,
  InternalUnstakeAppRes,
  InternalUnstakeNodeRes,
  InternalUpgradeRes,
} from "../../types/communications/transactions";
import type { BaseResponse } from "../../types/communications/common";
import browser, { type Runtime } from "webextension-polyfill";
import {
  AccountExistErrorName,
  AccountReference,
  CosmosTransactionTypes,
  EthereumNetworkProtocolService,
  ExternalAccessRequest,
  OriginReference,
  Passphrase,
  PermissionResources,
  PermissionsBuilder,
  PocketNetworkProtocolService,
  PrivateKeyRestoreErrorName,
  ProtocolServiceFactory,
  RecoveryPhraseExistErrorName,
  SupportedProtocols,
  ValidateTransactionResult,
  VaultRestoreErrorName,
} from "@soothe/vault";
import { WebEncryptionService } from "@soothe/vault-encryption-web";
import store, { RootState } from "../../redux/store";
import {
  ANSWER_BULK_PERSONAL_SIGN_REQUEST,
  ANSWER_BULK_PERSONAL_SIGN_RESPONSE,
  ANSWER_BULK_SIGN_TRANSACTION_REQUEST,
  ANSWER_BULK_SIGN_TRANSACTION_RESPONSE,
  ANSWER_CHANGE_PARAM_REQUEST,
  ANSWER_CHANGE_PARAM_RESPONSE,
  ANSWER_CONNECTION_REQUEST,
  ANSWER_CONNECTION_RESPONSE,
  ANSWER_DAO_TRANSFER_REQUEST,
  ANSWER_DAO_TRANSFER_RESPONSE,
  ANSWER_MIGRATE_MORSE_ACCOUNT_REQUEST,
  ANSWER_MIGRATE_MORSE_ACCOUNT_RESPONSE,
  ANSWER_NEW_ACCOUNT_REQUEST,
  ANSWER_NEW_ACCOUNT_RESPONSE,
  ANSWER_PERSONAL_SIGN_REQUEST,
  ANSWER_PERSONAL_SIGN_RESPONSE,
  ANSWER_PUBLIC_KEY_REQUEST,
  ANSWER_SIGNED_TYPED_DATA_REQUEST,
  ANSWER_SIGNED_TYPED_DATA_RESPONSE,
  ANSWER_STAKE_APP_REQUEST,
  ANSWER_STAKE_APP_RESPONSE,
  ANSWER_STAKE_NODE_REQUEST,
  ANSWER_STAKE_NODE_RESPONSE,
  ANSWER_SWITCH_CHAIN_REQUEST,
  ANSWER_SWITCH_CHAIN_RESPONSE,
  ANSWER_TRANSFER_APP_REQUEST,
  ANSWER_TRANSFER_APP_RESPONSE,
  ANSWER_TRANSFER_REQUEST,
  ANSWER_TRANSFER_RESPONSE,
  ANSWER_UNJAIL_NODE_REQUEST,
  ANSWER_UNJAIL_NODE_RESPONSE,
  ANSWER_UNSTAKE_APP_REQUEST,
  ANSWER_UNSTAKE_APP_RESPONSE,
  ANSWER_UNSTAKE_NODE_REQUEST,
  ANSWER_UNSTAKE_NODE_RESPONSE,
  ANSWER_UPGRADE_REQUEST,
  ANSWER_UPGRADE_RESPONSE,
  ANSWER_VALIDATE_POKT_TX_REQUEST,
  ANSWER_VALIDATE_POKT_TX_RESPONSE,
  BULK_PERSONAL_SIGN_REQUEST,
  BULK_PERSONAL_SIGN_RESPONSE,
  BULK_SIGN_TRANSACTION_REQUEST,
  BULK_SIGN_TRANSACTION_RESPONSE,
  CHANGE_PARAM_REQUEST,
  CHANGE_PARAM_RESPONSE,
  CHECK_PERMISSION_FOR_SESSION_REQUEST,
  CHECK_PERMISSION_FOR_SESSION_RESPONSE,
  CONNECTION_REQUEST_MESSAGE,
  CONNECTION_RESPONSE_MESSAGE,
  CREATE_ACCOUNT_FROM_HD_SEED_REQUEST,
  CREATE_ACCOUNT_FROM_HD_SEED_RESPONSE,
  DAO_TRANSFER_REQUEST,
  DAO_TRANSFER_RESPONSE,
  EXPORT_VAULT_REQUEST,
  EXPORT_VAULT_RESPONSE,
  GET_RECOVERY_PHRASE_ID_REQUEST,
  GET_RECOVERY_PHRASE_ID_RESPONSE,
  IMPORT_ACCOUNT_REQUEST,
  IMPORT_ACCOUNT_RESPONSE,
  IMPORT_HD_WALLET_REQUEST,
  IMPORT_HD_WALLET_RESPONSE,
  IMPORT_VAULT_REQUEST,
  IMPORT_VAULT_RESPONSE,
  INITIALIZE_VAULT_REQUEST,
  INITIALIZE_VAULT_RESPONSE,
  LOCK_VAULT_REQUEST,
  LOCK_VAULT_RESPONSE,
  NETWORK_FEE_REQUEST,
  NETWORK_FEE_RESPONSE,
  PERSONAL_SIGN_REQUEST,
  PERSONAL_SIGN_RESPONSE,
  PK_ACCOUNT_REQUEST,
  PK_ACCOUNT_RESPONSE,
  PUBLIC_KEY_REQUEST,
  PUBLIC_KEY_RESPONSE,
  REMOVE_ACCOUNT_REQUEST,
  REMOVE_ACCOUNT_RESPONSE,
  REMOVE_RECOVERY_PHRASE_REQUEST,
  REMOVE_RECOVERY_PHRASE_RESPONSE,
  REVOKE_EXTERNAL_SESSIONS_REQUEST,
  REVOKE_EXTERNAL_SESSIONS_RESPONSE,
  REVOKE_SESSION_REQUEST,
  REVOKE_SESSION_RESPONSE,
  SET_REQUIRE_PASSWORD_FOR_OPTS_REQUEST,
  SET_REQUIRE_PASSWORD_FOR_OPTS_RESPONSE,
  SHOULD_EXPORT_VAULT_REQUEST,
  SHOULD_EXPORT_VAULT_RESPONSE,
  SIGN_TYPED_DATA_REQUEST,
  SIGN_TYPED_DATA_RESPONSE,
  STAKE_APP_REQUEST,
  STAKE_APP_RESPONSE,
  STAKE_NODE_REQUEST,
  STAKE_NODE_RESPONSE,
  SWITCH_CHAIN_RESPONSE,
  TRANSFER_APP_REQUEST,
  TRANSFER_APP_RESPONSE,
  TRANSFER_REQUEST,
  TRANSFER_RESPONSE,
  UNJAIL_NODE_REQUEST,
  UNJAIL_NODE_RESPONSE,
  UNLOCK_VAULT_REQUEST,
  UNLOCK_VAULT_RESPONSE,
  UNSTAKE_APP_REQUEST,
  UNSTAKE_APP_RESPONSE,
  UNSTAKE_NODE_REQUEST,
  UNSTAKE_NODE_RESPONSE,
  UPDATE_ACCOUNT_REQUEST,
  UPDATE_ACCOUNT_RESPONSE,
  UPDATE_RECOVERY_PHRASE_REQUEST,
  UPDATE_RECOVERY_PHRASE_RESPONSE,
  UPGRADE_REQUEST,
  UPGRADE_RESPONSE,
} from "../../constants/communication";
import {
  changeActiveTab,
  changeSelectedNetwork,
  removeExternalRequest,
  resetRequestsState,
  setNetworksWithErrors,
  setRequirePasswordSensitiveOpts,
  setSessionMaxAgeData,
} from "../../redux/slices/app";
import {
  getVaultPassword,
  initVault,
  lockVault,
  unlockVault,
} from "../../redux/slices/vault";
import {
  addNewAccount,
  createNewAccountFromHdSeed,
  getPoktTxFromRequest,
  getPrivateKeyOfAccount,
  importAccount,
  migrateMorseAccount,
  removeAccount,
  sendPoktTx,
  sendTransfer,
  signTransactions,
  updateAccount,
} from "../../redux/slices/vault/account";
import {
  authorizeExternalSession,
  revokeAllExternalSessions,
  revokeSession,
} from "../../redux/slices/vault/session";
import { OperationRejected, UnknownError } from "../../errors/communication";
import { runWithNetworks } from "../../utils/networkOperations";
import { getVault } from "../../utils";
import {
  exportVault,
  hashString,
  importVault,
} from "../../redux/slices/vault/backup";
import {
  importRecoveryPhrase,
  removeRecoveryPhrase,
  updateRecoveryPhrase,
} from "../../redux/slices/vault/phrases";
import {
  AnswerMigrateMorseAccountReq,
  AnswerMigrateMorseAccountRes,
} from "../../types/communications/migration";
import { TransactionStatus } from "../datasource/Transaction";

type MessageSender = Runtime.MessageSender;

const ethService = new EthereumNetworkProtocolService(
  new WebEncryptionService()
);

const mapMessageType: Record<InternalRequests["type"], true> = {
  [ANSWER_CONNECTION_REQUEST]: true,
  [ANSWER_NEW_ACCOUNT_REQUEST]: true,
  [ANSWER_TRANSFER_REQUEST]: true,
  [INITIALIZE_VAULT_REQUEST]: true,
  [UNLOCK_VAULT_REQUEST]: true,
  [LOCK_VAULT_REQUEST]: true,
  [REVOKE_EXTERNAL_SESSIONS_REQUEST]: true,
  [REVOKE_SESSION_REQUEST]: true,
  [UPDATE_ACCOUNT_REQUEST]: true,
  [REMOVE_ACCOUNT_REQUEST]: true,
  [IMPORT_ACCOUNT_REQUEST]: true,
  [PK_ACCOUNT_REQUEST]: true,
  [NETWORK_FEE_REQUEST]: true,
  [CHECK_PERMISSION_FOR_SESSION_REQUEST]: true,
  [ANSWER_SWITCH_CHAIN_REQUEST]: true,
  [ANSWER_SIGNED_TYPED_DATA_REQUEST]: true,
  [ANSWER_PERSONAL_SIGN_REQUEST]: true,
  [ANSWER_BULK_PERSONAL_SIGN_REQUEST]: true,
  [EXPORT_VAULT_REQUEST]: true,
  [SHOULD_EXPORT_VAULT_REQUEST]: true,
  [IMPORT_VAULT_REQUEST]: true,
  [SET_REQUIRE_PASSWORD_FOR_OPTS_REQUEST]: true,
  [IMPORT_HD_WALLET_REQUEST]: true,
  [CREATE_ACCOUNT_FROM_HD_SEED_REQUEST]: true,
  [UPDATE_RECOVERY_PHRASE_REQUEST]: true,
  [REMOVE_RECOVERY_PHRASE_REQUEST]: true,
  [GET_RECOVERY_PHRASE_ID_REQUEST]: true,
  [ANSWER_STAKE_NODE_REQUEST]: true,
  [ANSWER_UNSTAKE_NODE_REQUEST]: true,
  [ANSWER_UNJAIL_NODE_REQUEST]: true,
  [ANSWER_STAKE_APP_REQUEST]: true,
  [ANSWER_TRANSFER_APP_REQUEST]: true,
  [ANSWER_UNSTAKE_APP_REQUEST]: true,
  [ANSWER_CHANGE_PARAM_REQUEST]: true,
  [ANSWER_DAO_TRANSFER_REQUEST]: true,
  [ANSWER_VALIDATE_POKT_TX_REQUEST]: true,
  [ANSWER_PUBLIC_KEY_REQUEST]: true,
  [ANSWER_UPGRADE_REQUEST]: true,
  [ANSWER_BULK_SIGN_TRANSACTION_REQUEST]: true,
  [ANSWER_MIGRATE_MORSE_ACCOUNT_REQUEST]: true,
};

// Controller to manage the communication between extension views and the background
class InternalCommunicationController implements ICommunicationController {
  constructor() {
    browser.windows.onRemoved.addListener(this._handleOnRemovedWindow);
  }

  messageForController(messageType: string) {
    return mapMessageType[messageType] || false;
  }

  async onMessageHandler(message: InternalRequests, _: MessageSender) {
    if (message?.type === ANSWER_CONNECTION_REQUEST) {
      return this._answerConnectionRequest(message);
    }

    if (message?.type === ANSWER_NEW_ACCOUNT_REQUEST) {
      return this._answerCreateNewAccount(message);
    }

    if (message?.type === ANSWER_TRANSFER_REQUEST) {
      return this._answerTransferAccount(message);
    }

    if (message?.type === INITIALIZE_VAULT_REQUEST) {
      return this._handleInitializeVault(message.data);
    }

    if (message?.type === UNLOCK_VAULT_REQUEST) {
      return this._handleUnlockVault(message.data);
    }

    if (message?.type === LOCK_VAULT_REQUEST) {
      return this._handleLockVault();
    }

    if (message?.type === REVOKE_EXTERNAL_SESSIONS_REQUEST) {
      return this._handleRevokeExternalSessions();
    }

    if (message?.type === REVOKE_SESSION_REQUEST) {
      return this._handleRevokeSession(message.data.sessionId);
    }

    if (message?.type === UPDATE_ACCOUNT_REQUEST) {
      return this._handleUpdateAccount(message);
    }

    if (message?.type === REMOVE_ACCOUNT_REQUEST) {
      return this._handleRemoveAccount(message);
    }

    if (message?.type === IMPORT_ACCOUNT_REQUEST) {
      return this._handleImportAccount(message);
    }

    if (message?.type === PK_ACCOUNT_REQUEST) {
      return this._getPrivateKeyOfAccount(message);
    }

    if (message?.type === NETWORK_FEE_REQUEST) {
      return this._getNetworkFee(message);
    }

    if (message?.type === CHECK_PERMISSION_FOR_SESSION_REQUEST) {
      return this._checkPermissionsForSession(message);
    }

    if (message?.type === ANSWER_SWITCH_CHAIN_REQUEST) {
      return this._answerSwitchChainRequest(message);
    }

    if (message?.type === ANSWER_SIGNED_TYPED_DATA_REQUEST) {
      return this._answerSignedTypedDataRequest(message);
    }

    if (message?.type === ANSWER_PERSONAL_SIGN_REQUEST) {
      return this._answerPersonalSignRequest(message);
    }

    if (message?.type === ANSWER_BULK_PERSONAL_SIGN_REQUEST) {
      return this._answerBulkPersonalSignRequest(message);
    }

    if (message?.type === EXPORT_VAULT_REQUEST) {
      return this._exportVault(message);
    }

    if (message?.type === SHOULD_EXPORT_VAULT_REQUEST) {
      return this._shouldExportVault();
    }

    if (message?.type === IMPORT_VAULT_REQUEST) {
      return this._importVault(message);
    }

    if (message?.type === SET_REQUIRE_PASSWORD_FOR_OPTS_REQUEST) {
      return this._setRequirePasswordForOpts(message);
    }

    if (message?.type === IMPORT_HD_WALLET_REQUEST) {
      return this._handleImportHdWallet(message);
    }

    if (message?.type === CREATE_ACCOUNT_FROM_HD_SEED_REQUEST) {
      return this._handleCreateAccountFromHdSeed(message);
    }

    if (message?.type === UPDATE_RECOVERY_PHRASE_REQUEST) {
      return this._handleUpdateRecoveryPhrase(message);
    }

    if (message?.type === REMOVE_RECOVERY_PHRASE_REQUEST) {
      return this._handleRemoveRecoveryPhrase(message);
    }

    if (message?.type === GET_RECOVERY_PHRASE_ID_REQUEST) {
      return this._getRecoveryPhraseIdByPhrase(message);
    }

    if (message?.type === ANSWER_MIGRATE_MORSE_ACCOUNT_REQUEST) {
      return this._answerMigrateMorseAccount(message);
    }

    if (message?.type === ANSWER_UNSTAKE_NODE_REQUEST) {
      return this._answerBasePoktTxRequest(
        message,
        ANSWER_UNSTAKE_NODE_RESPONSE,
        UNSTAKE_NODE_REQUEST,
        UNSTAKE_NODE_RESPONSE
      );
    }

    if (message?.type === ANSWER_STAKE_NODE_REQUEST) {
      return this._answerBasePoktTxRequest(
        message,
        ANSWER_STAKE_NODE_RESPONSE,
        STAKE_NODE_REQUEST,
        STAKE_NODE_RESPONSE
      );
    }

    if (message?.type === ANSWER_UNJAIL_NODE_REQUEST) {
      return this._answerBasePoktTxRequest(
        message,
        ANSWER_UNJAIL_NODE_RESPONSE,
        UNJAIL_NODE_REQUEST,
        UNJAIL_NODE_RESPONSE
      );
    }

    if (message?.type === ANSWER_STAKE_APP_REQUEST) {
      return this._answerBasePoktTxRequest(
        message,
        ANSWER_STAKE_APP_RESPONSE,
        STAKE_APP_REQUEST,
        STAKE_APP_RESPONSE
      );
    }

    if (message?.type === ANSWER_TRANSFER_APP_REQUEST) {
      return this._answerBasePoktTxRequest(
        message,
        ANSWER_TRANSFER_APP_RESPONSE,
        TRANSFER_APP_REQUEST,
        TRANSFER_APP_RESPONSE
      );
    }

    if (message?.type === ANSWER_UNSTAKE_APP_REQUEST) {
      return this._answerBasePoktTxRequest(
        message,
        ANSWER_UNSTAKE_APP_RESPONSE,
        UNSTAKE_APP_REQUEST,
        UNSTAKE_APP_RESPONSE
      );
    }

    if (message?.type === ANSWER_CHANGE_PARAM_REQUEST) {
      return this._answerBasePoktTxRequest(
        message,
        ANSWER_CHANGE_PARAM_RESPONSE,
        CHANGE_PARAM_REQUEST,
        CHANGE_PARAM_RESPONSE
      );
    }

    if (message?.type === ANSWER_DAO_TRANSFER_REQUEST) {
      return this._answerBasePoktTxRequest(
        message,
        ANSWER_DAO_TRANSFER_RESPONSE,
        DAO_TRANSFER_REQUEST,
        DAO_TRANSFER_RESPONSE
      );
    }

    if (message?.type === ANSWER_UPGRADE_REQUEST) {
      return this._answerBasePoktTxRequest(
        message,
        ANSWER_UPGRADE_RESPONSE,
        UPGRADE_REQUEST,
        UPGRADE_RESPONSE
      );
    }

    if (message?.type === ANSWER_VALIDATE_POKT_TX_REQUEST) {
      return this._validatePoktTx(message);
    }

    if (message?.type === ANSWER_PUBLIC_KEY_REQUEST) {
      return this._answerPublicKeyRequest(message);
    }

    if (message?.type === ANSWER_BULK_SIGN_TRANSACTION_REQUEST) {
      return this._answerSignTxRequest(message);
    }
  }

  private async _handleOnRemovedWindow(windowId: number) {
    const { requestsWindowId, externalRequests } = store.getState().app;

    if (externalRequests?.length && windowId === requestsWindowId) {
      await Promise.all([
        ...externalRequests.map((request: AppRequests) => {
          let response:
            | InternalTransferRes
            | InternalConnectionRes
            | InternalSwitchChainRes
            | InternalSignedTypedDataRes
            | InternalPersonalSignRes
            | InternalBulkPersonalSignRes
            | InternalUnstakeNodeRes
            | InternalStakeNodeRes
            | InternalUnjailNodeRes
            | InternalStakeAppRes
            | InternalTransferAppRes
            | InternalUnstakeAppRes
            | InternalChangeParamRes
            | InternalDaoTransferRes
            | InternalUpgradeRes
            | InternalPublicKeyRes
            | InternalBulkSignTransactionRes;

          if (request.type === CONNECTION_REQUEST_MESSAGE) {
            response = {
              requestId: request.requestId,
              type: CONNECTION_RESPONSE_MESSAGE,
              data: {
                accepted: false,
                session: null,
              },
              error: null,
            } as InternalConnectionRes;
          } else if (request.type === TRANSFER_REQUEST) {
            response = {
              requestId: request.requestId,
              type: TRANSFER_RESPONSE,
              data: {
                rejected: true,
                hash: null,
                protocol: null,
              },
              error: null,
            } as InternalTransferRes;
          } else if (request.type === UNSTAKE_NODE_REQUEST) {
            response = {
              requestId: request.requestId,
              type: UNSTAKE_NODE_RESPONSE,
              data: {
                rejected: true,
                hash: null,
                protocol: null,
              },
              error: null,
            } as InternalUnstakeNodeRes;
          } else if (request.type === STAKE_NODE_REQUEST) {
            response = {
              requestId: request.requestId,
              type: STAKE_NODE_RESPONSE,
              data: {
                rejected: true,
                hash: null,
                protocol: null,
              },
              error: null,
            } as InternalStakeNodeRes;
          } else if (request.type === UNJAIL_NODE_REQUEST) {
            response = {
              requestId: request.requestId,
              type: UNJAIL_NODE_RESPONSE,
              data: {
                rejected: true,
                hash: null,
                protocol: null,
              },
              error: null,
            } as InternalUnjailNodeRes;
          } else if (request.type === STAKE_APP_REQUEST) {
            response = {
              requestId: request.requestId,
              type: STAKE_APP_RESPONSE,
              data: {
                rejected: true,
                hash: null,
                protocol: null,
              },
              error: null,
            } as InternalStakeAppRes;
          } else if (request.type === TRANSFER_APP_REQUEST) {
            response = {
              requestId: request.requestId,
              type: TRANSFER_APP_RESPONSE,
              data: {
                rejected: true,
                hash: null,
                protocol: null,
              },
              error: null,
            } as InternalTransferAppRes;
          } else if (request.type === UNSTAKE_APP_REQUEST) {
            response = {
              requestId: request.requestId,
              type: UNSTAKE_APP_RESPONSE,
              data: {
                rejected: true,
                hash: null,
                protocol: null,
              },
              error: null,
            } as InternalUnstakeAppRes;
          } else if (request.type === CHANGE_PARAM_REQUEST) {
            response = {
              requestId: request.requestId,
              type: CHANGE_PARAM_RESPONSE,
              data: {
                rejected: true,
                hash: null,
                protocol: null,
              },
              error: null,
            } as InternalChangeParamRes;
          } else if (request.type === DAO_TRANSFER_REQUEST) {
            response = {
              requestId: request.requestId,
              type: DAO_TRANSFER_RESPONSE,
              data: {
                rejected: true,
                hash: null,
                protocol: null,
              },
              error: null,
            } as InternalDaoTransferRes;
          } else if (request.type === UPGRADE_REQUEST) {
            response = {
              requestId: request.requestId,
              type: UPGRADE_RESPONSE,
              data: {
                rejected: true,
                hash: null,
                protocol: null,
              },
              error: null,
            } as InternalUpgradeRes;
          } else if (request.type === BULK_SIGN_TRANSACTION_REQUEST) {
            response = {
              type: BULK_SIGN_TRANSACTION_RESPONSE,
              requestId: request.requestId,
              data: {
                rejected: true,
                signatures: null,
                protocol: null,
              },
              error: null,
            };
          } else if (request.type === SIGN_TYPED_DATA_REQUEST) {
            response = {
              requestId: request.requestId,
              type: SIGN_TYPED_DATA_RESPONSE,
              data: null,
              error: OperationRejected,
            } as InternalSignedTypedDataRes;
          } else if (request.type === PERSONAL_SIGN_REQUEST) {
            response = {
              requestId: request.requestId,
              type: PERSONAL_SIGN_RESPONSE,
              data: null,
              error: OperationRejected,
            } as InternalPersonalSignRes;
          } else if (request.type === BULK_PERSONAL_SIGN_REQUEST) {
            response = {
              requestId: request.requestId,
              type: BULK_PERSONAL_SIGN_RESPONSE,
              data: null,
              error: OperationRejected,
            } as InternalBulkPersonalSignRes;
          } else if (request.type === PUBLIC_KEY_REQUEST) {
            response = {
              requestId: request.requestId,
              type: PUBLIC_KEY_RESPONSE,
              data: null,
              error: OperationRejected,
            } as InternalPublicKeyRes;
          } else {
            response = {
              requestId: request.requestId,
              type: SWITCH_CHAIN_RESPONSE,
              data: null,
              error: OperationRejected,
            } as InternalSwitchChainRes;
          }

          return browser.tabs.sendMessage(request.tabId, response);
        }),
        browser.action.setBadgeText({ text: "" }),
      ]);
    }

    if (windowId === requestsWindowId) {
      await store.dispatch(resetRequestsState());
    }
  }

  private async _handleInitializeVault(
    data: InitializeVaultReq["data"]
  ): Promise<InitializeVaultRes> {
    try {
      await store
        .dispatch(
          setRequirePasswordSensitiveOpts(data.requirePasswordForSensitiveOpts)
        )
        .unwrap();
      await store
        .dispatch(
          setSessionMaxAgeData({
            maxAgeInSecs: data.sessionsMaxAge.maxAge,
            enabled: data.sessionsMaxAge.enabled,
          })
        )
        .unwrap();
      await store.dispatch(initVault(data.password)).unwrap();
      return {
        type: INITIALIZE_VAULT_RESPONSE,
        data: {
          answered: true,
        },
        error: null,
      };
    } catch (e) {
      return {
        type: INITIALIZE_VAULT_RESPONSE,
        data: null,
        error: UnknownError,
      };
    }
  }

  private async _handleUnlockVault(
    data: UnlockVaultReq["data"]
  ): Promise<UnlockVaultRes> {
    try {
      await store.dispatch(unlockVault(data.password)).unwrap();

      return {
        type: UNLOCK_VAULT_RESPONSE,
        data: {
          answered: true,
          isPasswordWrong: false,
        },
        error: null,
      };
    } catch (error) {
      if (error?.name === VaultRestoreErrorName) {
        return {
          type: UNLOCK_VAULT_RESPONSE,
          data: {
            answered: true,
            isPasswordWrong: true,
          },
          error: null,
        };
      }

      return {
        type: UNLOCK_VAULT_RESPONSE,
        data: null,
        error: UnknownError,
      };
    }
  }

  private async _handleLockVault(): Promise<LockVaultRes> {
    try {
      await store.dispatch(lockVault());

      return {
        type: LOCK_VAULT_RESPONSE,
        data: {
          answered: true,
        },
        error: null,
      };
    } catch (e) {
      return {
        type: LOCK_VAULT_RESPONSE,
        data: null,
        error: UnknownError,
      };
    }
  }

  private async _handleRevokeSession(
    sessionId: string
  ): Promise<RevokeSessionRes> {
    try {
      await store
        .dispatch(revokeSession({ sessionId, external: false }))
        .unwrap();

      return {
        type: REVOKE_SESSION_RESPONSE,
        data: {
          answered: true,
        },
        error: null,
      };
    } catch (e) {
      return {
        type: REVOKE_SESSION_RESPONSE,
        data: null,
        error: UnknownError,
      };
    }
  }

  private async _handleRevokeExternalSessions(): Promise<RevokeExternalSessionsRes> {
    try {
      await store.dispatch(revokeAllExternalSessions()).unwrap();

      return {
        type: REVOKE_EXTERNAL_SESSIONS_RESPONSE,
        data: {
          answered: true,
        },
        error: null,
      };
    } catch (e) {
      return {
        type: REVOKE_EXTERNAL_SESSIONS_RESPONSE,
        data: null,
        error: UnknownError,
      };
    }
  }

  private async _answerConnectionRequest(
    message: AnswerConnectionReq
  ): Promise<AnswerConnectionRes> {
    try {
      const { accepted, selectedAccounts, request, protocol } =
        message?.data || {};
      const { origin, tabId, type } = request;

      const promises: Promise<unknown>[] = [];
      let responseToProxy: InternalConnectionRes;

      if (!accepted) {
        responseToProxy = {
          type: CONNECTION_RESPONSE_MESSAGE,
          data: {
            accepted: false,
            addresses: null,
            session: null,
            protocol,
          },
          requestId: request?.requestId,
          error: null,
        };

        promises.push(browser.tabs.sendMessage(tabId, responseToProxy));
      } else {
        const permissionBuilder = new PermissionsBuilder();

        permissionBuilder
          .forResource(PermissionResources.account)
          .allow("read")
          .on(...selectedAccounts)
          .forResource(PermissionResources.transaction)
          .allow("send")
          .on(...selectedAccounts);

        const permissions = permissionBuilder.build();
        const { sessionsMaxAge } = store.getState().app;
        const maxAge = sessionsMaxAge.enabled
          ? sessionsMaxAge.maxAgeInSecs || 3600
          : 0;
        const originReference = new OriginReference(origin);
        const requestReference = new ExternalAccessRequest(
          permissions,
          maxAge,
          originReference
        );

        const [session, tabs] = await Promise.all([
          store
            .dispatch(
              authorizeExternalSession({
                request: requestReference,
                protocol,
              })
            )
            .unwrap(),
          browser.tabs.query({ url: `${origin}/*` }),
        ]);

        if (session) {
          const currentSelectedAccountForProtocol =
            store.getState().app.selectedAccountByProtocol[protocol];

          const selectedAccountOnApp = selectedAccounts.find(
            (address) => address === currentSelectedAccountForProtocol
          );

          let addresses: string[];

          if (selectedAccountOnApp) {
            addresses = [
              selectedAccountOnApp,
              ...selectedAccounts.filter(
                (address) => address !== selectedAccountOnApp
              ),
            ];
          } else {
            addresses = selectedAccounts;
          }

          responseToProxy = {
            type: CONNECTION_RESPONSE_MESSAGE,
            requestId: request?.requestId,
            data: {
              accepted: true,
              addresses,
              session: {
                id: session.id,
                maxAge,
                createdAt: session.createdAt,
              },
              protocol,
            },
            error: null,
          };
          promises.push(
            ...tabs.map((tab) =>
              browser.tabs.sendMessage(tab.id, responseToProxy)
            )
          );
        }
      }

      promises.push(
        store.dispatch(
          removeExternalRequest({ origin, type, protocol: request.protocol })
        ) as unknown as Promise<unknown>
      );

      await Promise.all(promises);
      const activeTabs = await browser.tabs.query({ active: true });
      if (activeTabs.length) {
        const activeTab = activeTabs[0];

        await store.dispatch(
          changeActiveTab({
            favIconUrl: activeTab.favIconUrl,
            url: activeTab.url,
            id: activeTab.id,
          })
        );
      }

      if (request) {
        await this._updateBadgeText();
      }

      return {
        type: ANSWER_CONNECTION_RESPONSE,
        data: {
          answered: true,
        },
        error: null,
      };
    } catch (e) {
      const tabId = message?.data?.request?.tabId;

      if (tabId) {
        await browser.tabs
          .sendMessage(tabId, {
            type: CONNECTION_RESPONSE_MESSAGE,
            data: null,
            error: UnknownError,
          })
          .catch();
      }

      return {
        type: ANSWER_CONNECTION_RESPONSE,
        data: null,
        error: UnknownError,
      };
    }
  }

  private async _answerSwitchChainRequest(
    message: AnswerSwitchChainReq
  ): Promise<AnswerSwitchChainRes> {
    try {
      const { accepted, request } = message?.data || {};
      const { origin, tabId, type } = request;

      const promises: Promise<unknown>[] = [];
      let responseToProxy: ExternalSwitchChainRes;

      if (!accepted) {
        responseToProxy = {
          requestId: request?.requestId,
          type: SWITCH_CHAIN_RESPONSE,
          data: null,
          error: OperationRejected,
        };

        promises.push(browser.tabs.sendMessage(tabId, responseToProxy));
      } else {
        await store
          .dispatch(
            changeSelectedNetwork({
              network: request.protocol,
              chainId: request.chainId,
            })
          )
          .unwrap();

        responseToProxy = {
          requestId: request?.requestId,
          type: SWITCH_CHAIN_RESPONSE,
          data: null,
          error: null,
        };
      }

      promises.push(
        browser.tabs.sendMessage(tabId, responseToProxy),
        store.dispatch(
          removeExternalRequest({ origin, type, protocol: request.protocol })
        ) as unknown as Promise<unknown>
      );

      await Promise.all(promises);

      if (request) {
        await this._updateBadgeText();
      }

      return {
        type: ANSWER_SWITCH_CHAIN_RESPONSE,
        data: {
          answered: true,
        },
        error: null,
      };
    } catch (e) {
      const tabId = message?.data?.request?.tabId;

      if (tabId) {
        await browser.tabs
          .sendMessage(tabId, {
            type: SWITCH_CHAIN_RESPONSE,
            data: null,
            error: UnknownError,
          } as InternalSwitchChainRes)
          .catch();
      }

      return {
        type: ANSWER_SWITCH_CHAIN_RESPONSE,
        data: null,
        error: UnknownError,
      };
    }
  }

  private async _answerSignedTypedDataRequest(
    message: AnswerSignedTypedDataReq
  ): Promise<AnswerSignedTypedDataRes> {
    try {
      const { accepted, request } = message?.data || {};
      const { origin, tabId, type } = request;

      const promises: Promise<unknown>[] = [];
      let responseToProxy: InternalSignedTypedDataRes;

      if (!accepted) {
        responseToProxy = {
          requestId: request?.requestId,
          type: SIGN_TYPED_DATA_RESPONSE,
          data: null,
          error: OperationRejected,
        };
      } else {
        const pk = await this._getAccountPrivateKey(
          request.address,
          request.protocol,
          request.sessionId
        );

        const sign = await ethService.signTypedData({
          data: request.data,
          privateKey: pk.replace("0x", ""),
        });

        responseToProxy = {
          requestId: request?.requestId,
          type: SIGN_TYPED_DATA_RESPONSE,
          data: {
            sign,
          },
          error: null,
        };
      }

      promises.push(
        browser.tabs.sendMessage(tabId, responseToProxy),
        store.dispatch(
          removeExternalRequest({ origin, type, protocol: request.protocol })
        ) as unknown as Promise<unknown>
      );

      await Promise.all(promises);
      await this._updateBadgeText();

      return {
        type: ANSWER_SIGNED_TYPED_DATA_RESPONSE,
        data: {
          answered: true,
        },
        error: null,
      };
    } catch (e) {
      console.log("ERR SIGN TYPED DATA:", e);
      const tabId = message?.data?.request?.tabId;

      if (tabId) {
        await browser.tabs
          .sendMessage(tabId, {
            type: SIGN_TYPED_DATA_RESPONSE,
            data: null,
            error: UnknownError,
          } as ExternalSignTypedDataRes)
          .catch();
      }

      return {
        type: ANSWER_SIGNED_TYPED_DATA_RESPONSE,
        data: null,
        error: UnknownError,
      };
    }
  }

  private async _answerPersonalSignRequest(
    message: AnswerPersonalSignReq
  ): Promise<AnswerPersonalSignRes> {
    try {
      const { accepted, request } = message?.data || {};
      const { origin, tabId, type } = request;

      const promises: Promise<unknown>[] = [];
      let responseToProxy: InternalPersonalSignRes;

      if (!accepted) {
        responseToProxy = {
          requestId: request?.requestId,
          type: PERSONAL_SIGN_RESPONSE,
          data: null,
          error: OperationRejected,
        };
      } else {
        const pk = await this._getAccountPrivateKey(
          request.address,
          request.protocol,
          request.sessionId
        );

        const signResult = await ProtocolServiceFactory.getProtocolService(
          request.protocol,
          new WebEncryptionService()
        ).signPersonalData({
          privateKey: pk,
          challenge: request.challenge,
        });
        responseToProxy = {
          requestId: request?.requestId,
          type: PERSONAL_SIGN_RESPONSE,
          data: {
            sign: signResult,
          },
          error: null,
        };
      }

      promises.push(
        browser.tabs.sendMessage(tabId, responseToProxy),
        store.dispatch(
          removeExternalRequest({ origin, type, protocol: request.protocol })
        ) as unknown as Promise<unknown>
      );

      await Promise.all(promises);
      await this._updateBadgeText();

      return {
        type: ANSWER_PERSONAL_SIGN_RESPONSE,
        data: {
          answered: true,
        },
        error: null,
      };
    } catch (e) {
      const tabId = message?.data?.request?.tabId;

      if (tabId) {
        await browser.tabs
          .sendMessage(tabId, {
            type: PERSONAL_SIGN_RESPONSE,
            data: null,
            error: UnknownError,
          } as InternalPersonalSignRes)
          .catch();
      }

      return {
        type: ANSWER_PERSONAL_SIGN_RESPONSE,
        data: null,
        error: UnknownError,
      };
    }
  }

  private async _answerBulkPersonalSignRequest(
    message: AnswerBulkPersonalSignReq
  ): Promise<AnswerBulkPersonalSignRes> {
    try {
      const { accepted, request } = message?.data || {};
      const { origin, tabId, type } = request;

      const promises: Promise<unknown>[] = [];
      let responseToProxy: InternalBulkPersonalSignRes;

      if (!accepted) {
        responseToProxy = {
          requestId: request?.requestId,
          type: BULK_PERSONAL_SIGN_RESPONSE,
          data: null,
          error: OperationRejected,
        };
      } else {
        const pk = await this._getAccountPrivateKey(
          request.address,
          request.protocol,
          request.sessionId
        );

        const signatures: Array<{
          id?: string;
          signature: string;
        }> = await Promise.all(
          request.challenges.map(({ id, challenge }) =>
            ProtocolServiceFactory.getProtocolService(
              request.protocol,
              new WebEncryptionService()
            )
              .signPersonalData({
                privateKey: pk,
                challenge,
              })
              .then((signature) => ({
                id,
                signature,
              }))
          )
        );

        responseToProxy = {
          requestId: request?.requestId,
          type: BULK_PERSONAL_SIGN_RESPONSE,
          data: {
            signatures,
          },
          error: null,
        };
      }

      promises.push(
        browser.tabs.sendMessage(tabId, responseToProxy),
        store.dispatch(
          removeExternalRequest({ origin, type, protocol: request.protocol })
        ) as unknown as Promise<unknown>
      );

      await Promise.all(promises);
      await this._updateBadgeText();

      return {
        type: ANSWER_BULK_PERSONAL_SIGN_RESPONSE,
        data: {
          answered: true,
        },
        error: null,
      };
    } catch (e) {
      const tabId = message?.data?.request?.tabId;

      if (tabId) {
        await browser.tabs
          .sendMessage(tabId, {
            type: BULK_PERSONAL_SIGN_RESPONSE,
            data: null,
            error: UnknownError,
          } as InternalBulkPersonalSignRes)
          .catch();
      }

      return {
        type: ANSWER_BULK_PERSONAL_SIGN_RESPONSE,
        data: null,
        error: UnknownError,
      };
    }
  }

  private async _answerPublicKeyRequest(message: AnswerPublicKeyReq) {
    try {
      const { request } = message?.data || {};
      const { origin, tabId, type } = request;

      const publicKey = await getVault().getPublicKey(
        request.sessionId,
        request.address
      );

      const responseToProxy: InternalPublicKeyRes = {
        requestId: request?.requestId,
        type: PUBLIC_KEY_RESPONSE,
        data: {
          publicKey,
        },
        error: null,
      };

      await Promise.all([
        browser.tabs.sendMessage(tabId, responseToProxy),
        store.dispatch(
          removeExternalRequest({ origin, type, protocol: request.protocol })
        ) as unknown as Promise<unknown>,
      ]);
      await this._updateBadgeText();
    } catch (e) {
      const tabId = message?.data?.request?.tabId;

      if (tabId) {
        await browser.tabs
          .sendMessage(tabId, {
            type: PUBLIC_KEY_RESPONSE,
            data: null,
            error: UnknownError,
            requestId: message?.data?.request?.requestId,
          } as InternalPublicKeyRes)
          .catch();
      }
    }
  }

  private async _answerCreateNewAccount(
    message: AnswerNewAccountReq
  ): Promise<AnswerNewAccountRes> {
    try {
      const { rejected, accountData } = message?.data || {};
      let address: string | null = null,
        accountId: string = null;

      if (!rejected) {
        const responseVault = await store
          .dispatch(
            addNewAccount({
              protocol: accountData.protocol,
              name: accountData.name,
              addressPrefix: accountData.addressPrefix,
            })
          )
          .unwrap();

        address = responseVault.accountReference.address;
        accountId = responseVault.accountReference.id;
      }

      return {
        type: ANSWER_NEW_ACCOUNT_RESPONSE,
        data: {
          answered: true,
          address,
          accountId,
        },
        error: null,
      };
    } catch (error) {
      if (error?.name === VaultRestoreErrorName) {
        return {
          type: ANSWER_NEW_ACCOUNT_RESPONSE,
          data: {
            answered: true,
            address: null,
            accountId: null,
          },
          error: null,
        };
      }

      return {
        type: ANSWER_NEW_ACCOUNT_RESPONSE,
        data: null,
        error: UnknownError,
      };
    }
  }

  private async _answerTransferAccount(
    message: AnswerTransferReq
  ): Promise<AnswerTransferRes> {
    try {
      const { rejected, request, transferData } = message?.data || {};

      let hash: string | null = null,
        failDetails: object | null = null,
        status: TransactionStatus | null = null;
      let response: InternalTransferRes;

      if (typeof rejected === "boolean" && rejected && request) {
        response = {
          type: TRANSFER_RESPONSE,
          requestId: request.requestId,
          data: {
            rejected: true,
            hash: null,
            protocol: request.protocol,
          },
          error: null,
        };
        await Promise.all([
          browser.tabs.sendMessage(request.tabId, response),
          store.dispatch(
            removeExternalRequest({
              origin: request.origin,
              type: TRANSFER_REQUEST,
              protocol: request.protocol,
            })
          ),
        ]);
      } else if (!rejected) {
        const {
          app: { requirePasswordForSensitiveOpts },
          vault: { vaultSession },
        } = store.getState();

        if (requirePasswordForSensitiveOpts) {
          const vaultPassword = await getVaultPassword(vaultSession.id);

          if (vaultPassword !== transferData.from.passphrase) {
            return {
              type: ANSWER_TRANSFER_RESPONSE,
              data: {
                answered: true,
                hash: null,
                isPasswordWrong: true,
                status: null,
              },
              error: null,
            };
          }
        }

        const sendResponse = await store
          .dispatch(sendTransfer(transferData))
          .unwrap();

        hash = sendResponse.hash;
        failDetails = sendResponse.failDetails;
        status = sendResponse.status;

        if (request) {
          response = {
            type: TRANSFER_RESPONSE,
            requestId: request.requestId,
            data: {
              rejected: false,
              hash: sendResponse.hash,
              protocol: transferData.network.protocol,
            },
            error: null,
          };
          await Promise.all([
            browser.tabs.sendMessage(request.tabId, response),
            store.dispatch(
              removeExternalRequest({
                origin: request.origin,
                type: TRANSFER_REQUEST,
                protocol: request.protocol,
              })
            ),
          ]);
        }
      }

      if (request) {
        await this._updateBadgeText();
      }

      return {
        type: ANSWER_TRANSFER_RESPONSE,
        data: {
          answered: true,
          hash,
          details: failDetails,
          status,
        },
        error: null,
      };
    } catch (error) {
      if (error?.name === PrivateKeyRestoreErrorName) {
        return {
          type: ANSWER_TRANSFER_RESPONSE,
          data: {
            answered: true,
            isPasswordWrong: true,
            hash: null,
            status: null,
          },
          error: null,
        };
      }

      const tabId = message?.data?.request?.tabId;

      if (tabId) {
        await browser.tabs
          .sendMessage(tabId, {
            type: TRANSFER_RESPONSE,
            data: null,
            error: UnknownError,
          })
          .catch();
      }

      console.log("SEND TRANSFER ERROR:", error);

      return {
        type: ANSWER_TRANSFER_RESPONSE,
        data: null,
        error: UnknownError,
      };
    }
  }

  private async _answerBasePoktTxRequest<
    Req extends AnswerPoktTxRequests,
    TRes extends string,
    Res extends BaseResponse<TRes, AnswerBasePoktTxResponseData>,
    ETRes extends string,
    IRes extends InternalResponse<ETRes>
  >(
    message: Req,
    responseType: TRes,
    externalReqType: string,
    externalResponseType: ETRes
  ): Promise<Res> {
    try {
      const {
        rejected,
        request,
        vaultPassword: vaultPasswordFromRequest,
      } = message?.data || {};

      let hash: string | null = null;
      let response: IRes;

      if (typeof rejected === "boolean" && rejected && request) {
        response = {
          type: externalResponseType,
          requestId: request.requestId,
          data: {
            rejected: true,
            hash: null,
            protocol: request.protocol,
          },
          error: null,
        } as IRes;
        await Promise.all([
          browser.tabs.sendMessage(request.tabId, response),
          store.dispatch(
            removeExternalRequest({
              origin: request.origin,
              type: externalReqType,
              protocol: request.protocol,
            })
          ),
        ]);
      } else if (!rejected) {
        const {
          app: { requirePasswordForSensitiveOpts },
          vault: { vaultSession },
        } = store.getState();

        if (requirePasswordForSensitiveOpts) {
          const vaultPassword = await getVaultPassword(vaultSession.id);

          if (vaultPassword !== vaultPasswordFromRequest) {
            return {
              type: responseType,
              data: {
                answered: true,
                hash: null,
                isPasswordWrong: true,
              },
              error: null,
            } as Res;
          }
        }

        hash = await store.dispatch(sendPoktTx(message)).unwrap();

        if (request) {
          response = {
            type: externalResponseType,
            requestId: request.requestId,
            data: {
              rejected: false,
              hash,
              protocol: request.protocol,
            },
            error: null,
          } as IRes;
          await Promise.all([
            browser.tabs.sendMessage(request.tabId, response),
            store.dispatch(
              removeExternalRequest({
                origin: request.origin,
                type: externalReqType,
                protocol: request.protocol,
              })
            ),
          ]);
        }
      }

      if (request) {
        await this._updateBadgeText();
      }

      return {
        type: responseType,
        data: {
          answered: true,
          hash,
        },
        error: null,
      } as Res;
    } catch (error) {
      if (
        error?.name === PrivateKeyRestoreErrorName ||
        error?.name === VaultRestoreErrorName
      ) {
        return {
          type: responseType,
          data: {
            answered: true,
            isPasswordWrong: true,
            hash: null,
          },
          error: null,
        } as Res;
      }

      const tabId = message?.data?.request?.tabId;

      if (tabId) {
        await browser.tabs
          .sendMessage(tabId, {
            type: externalResponseType,
            data: null,
            error: UnknownError,
          })
          .catch();
      }

      console.log(`Tx ${message?.type} ERROR:`, error);

      return {
        type: responseType,
        data: null,
        error: UnknownError,
      } as Res;
    }
  }

  private async _answerMigrateMorseAccount(
    message: AnswerMigrateMorseAccountReq
  ): Promise<AnswerMigrateMorseAccountRes> {
    try {
      const hash = await store
        .dispatch(migrateMorseAccount(message.data))
        .unwrap();

      return {
        type: ANSWER_MIGRATE_MORSE_ACCOUNT_RESPONSE,
        data: {
          hash,
        },
        error: null,
      };
    } catch (e) {
      console.log("MIGRATE MORSE ACCOUNT ERR:", e);
      if (
        e?.name === PrivateKeyRestoreErrorName ||
        e?.name === VaultRestoreErrorName
      ) {
        return {
          type: ANSWER_MIGRATE_MORSE_ACCOUNT_RESPONSE,
          data: {
            isPasswordWrong: true,
            hash: null,
          },
          error: null,
        };
      }
      return {
        type: ANSWER_MIGRATE_MORSE_ACCOUNT_RESPONSE,
        data: null,
        error: UnknownError,
      };
    }
  }

  private async _answerSignTxRequest(
    message: AnswerBulkSignTransactionReq
  ): Promise<AnswerBulkSignTransactionRes> {
    try {
      const {
        rejected,
        request,
        vaultPassword: vaultPasswordFromRequest,
      } = message?.data || {};

      let signatures: Array<{
        id: string;
        signature: string;
        transactionHex: string;
        rawTx?: string;
        fee?: string;
      }> | null = null;
      let response: InternalBulkSignTransactionRes;

      if (typeof rejected === "boolean" && rejected && request) {
        response = {
          type: BULK_SIGN_TRANSACTION_RESPONSE,
          requestId: request.requestId,
          data: {
            rejected: true,
            protocol: request.protocol,
            signatures: null,
          },
          error: null,
        };
        await Promise.all([
          browser.tabs.sendMessage(request.tabId, response),
          store.dispatch(
            removeExternalRequest({
              origin: request.origin,
              type: BULK_SIGN_TRANSACTION_REQUEST,
              protocol: request.protocol,
            })
          ),
        ]);
      } else if (!rejected) {
        const {
          app: { requirePasswordForSensitiveOpts },
          vault: { vaultSession },
        } = store.getState();

        if (requirePasswordForSensitiveOpts) {
          const vaultPassword = await getVaultPassword(vaultSession.id);

          if (vaultPassword !== vaultPasswordFromRequest) {
            return {
              type: ANSWER_BULK_SIGN_TRANSACTION_RESPONSE,
              data: {
                answered: true,
                signatures: null,
                isPasswordWrong: true,
              },
              error: null,
            };
          }
        }

        signatures = await store.dispatch(signTransactions(message)).unwrap();

        if (request) {
          response = {
            type: BULK_SIGN_TRANSACTION_RESPONSE,
            requestId: request.requestId,
            data: {
              signatures,
              rejected: false,
              protocol: request.protocol,
            },
            error: null,
          };
          await Promise.all([
            browser.tabs.sendMessage(request.tabId, response),
            store.dispatch(
              removeExternalRequest({
                origin: request.origin,
                type: BULK_SIGN_TRANSACTION_REQUEST,
                protocol: request.protocol,
              })
            ),
          ]);
        }
      }

      if (request) {
        await this._updateBadgeText();
      }

      return {
        type: ANSWER_BULK_SIGN_TRANSACTION_RESPONSE,
        data: {
          answered: true,
          signatures,
        },
        error: null,
      };
    } catch (error) {
      if (
        error?.name === PrivateKeyRestoreErrorName ||
        error?.name === VaultRestoreErrorName
      ) {
        return {
          type: ANSWER_BULK_SIGN_TRANSACTION_RESPONSE,
          data: {
            answered: true,
            isPasswordWrong: true,
            signatures: null,
          },
          error: null,
        };
      }

      const tabId = message?.data?.request?.tabId;

      if (tabId) {
        await browser.tabs
          .sendMessage(tabId, {
            type: STAKE_NODE_RESPONSE,
            data: null,
            error: UnknownError,
          })
          .catch();
      }

      console.log(`Tx ${message?.type} ERROR:`, error);

      return {
        type: ANSWER_BULK_SIGN_TRANSACTION_RESPONSE,
        data: null,
        error: UnknownError,
      };
    }
  }

  private async _validatePoktTx(
    message: AnswerValidatePoktTxReq
  ): Promise<AnswerValidatePoktTxRes> {
    try {
      const result = await getPoktTxFromRequest({
        state: store.getState(),
        request: message.data.request,
        privateKey: "",
        fee: 0.01,
      });

      const protocolService = new PocketNetworkProtocolService(
        new WebEncryptionService()
      );

      const validationResult = await protocolService.validateTransaction(
        result.transaction,
        result.network
      );

      return {
        type: ANSWER_VALIDATE_POKT_TX_RESPONSE,
        data: {
          answered: true,
          result: validationResult,
        },
        error: null,
      };
    } catch (e) {
      console.log(e);
      if (e?.message?.startsWith("validator not found for")) {
        return {
          type: ANSWER_VALIDATE_POKT_TX_RESPONSE,
          data: {
            answered: true,
            result: new ValidateTransactionResult(),
          },
          error: null,
        };
      }
      return {
        type: ANSWER_VALIDATE_POKT_TX_RESPONSE,
        data: {
          answered: true,
          result: null,
        },
        error: UnknownError,
      };
    }
  }

  private async _handleUpdateAccount(
    message: UpdateAccountReq
  ): Promise<UpdateAccountRes> {
    try {
      await store.dispatch(updateAccount(message.data)).unwrap();

      return {
        type: UPDATE_ACCOUNT_RESPONSE,
        data: {
          answered: true,
        },
        error: null,
      };
    } catch (error) {
      if (error?.name === VaultRestoreErrorName) {
        return {
          type: UPDATE_ACCOUNT_RESPONSE,
          data: {
            answered: true,
            isPasswordWrong: true,
          },
          error: null,
        };
      }
      return {
        type: UPDATE_ACCOUNT_RESPONSE,
        data: null,
        error: UnknownError,
      };
    }
  }

  private async _handleRemoveAccount(
    message: RemoveAccountReq
  ): Promise<RemoveAccountRes> {
    try {
      await store.dispatch(removeAccount(message.data)).unwrap();

      return {
        type: REMOVE_ACCOUNT_RESPONSE,
        data: {
          answered: true,
        },
        error: null,
      };
    } catch (error) {
      if (error?.name === VaultRestoreErrorName) {
        return {
          type: REMOVE_ACCOUNT_RESPONSE,
          data: {
            answered: true,
            isPasswordWrong: true,
          },
          error: null,
        };
      }
      return {
        type: REMOVE_ACCOUNT_RESPONSE,
        data: null,
        error: UnknownError,
      };
    }
  }

  private async _handleUpdateRecoveryPhrase(
    message: UpdateRecoveryPhraseReq
  ): Promise<UpdateRecoveryPhraseRes> {
    try {
      await store.dispatch(updateRecoveryPhrase(message.data)).unwrap();

      return {
        type: UPDATE_RECOVERY_PHRASE_RESPONSE,
        data: {
          answered: true,
        },
        error: null,
      };
    } catch (error) {
      if (error?.name === VaultRestoreErrorName) {
        return {
          type: UPDATE_RECOVERY_PHRASE_RESPONSE,
          data: {
            answered: true,
            isPasswordWrong: true,
          },
          error: null,
        };
      }
      return {
        type: UPDATE_RECOVERY_PHRASE_RESPONSE,
        data: null,
        error: UnknownError,
      };
    }
  }

  private async _handleRemoveRecoveryPhrase(
    message: RemoveRecoveryPhraseReq
  ): Promise<RemoveRecoveryPhraseRes> {
    try {
      await store.dispatch(removeRecoveryPhrase(message.data)).unwrap();

      return {
        type: REMOVE_RECOVERY_PHRASE_RESPONSE,
        data: {
          answered: true,
        },
        error: null,
      };
    } catch (error) {
      if (error?.name === VaultRestoreErrorName) {
        return {
          type: REMOVE_RECOVERY_PHRASE_RESPONSE,
          data: {
            answered: true,
            isPasswordWrong: true,
          },
          error: null,
        };
      }
      return {
        type: REMOVE_RECOVERY_PHRASE_RESPONSE,
        data: null,
        error: UnknownError,
      };
    }
  }

  private async _handleImportAccount(
    message: ImportAccountReq
  ): Promise<ImportAccountRes> {
    try {
      const account = await store
        .dispatch(importAccount(message.data))
        .unwrap();

      return {
        type: IMPORT_ACCOUNT_RESPONSE,
        data: {
          answered: true,
          accountId: account.id,
        },
        error: null,
      };
    } catch (error) {
      if (error?.name === VaultRestoreErrorName) {
        return {
          type: IMPORT_ACCOUNT_RESPONSE,
          data: {
            answered: true,
            accountId: null,
          },
          error: null,
        };
      }

      if (error?.name === AccountExistErrorName) {
        return {
          type: IMPORT_ACCOUNT_RESPONSE,
          data: {
            answered: true,
            accountAlreadyExists: true,
            accountId: null,
          },
          error: null,
        };
      }
      return {
        type: IMPORT_ACCOUNT_RESPONSE,
        data: null,
        error: UnknownError,
      };
    }
  }

  private async _handleImportHdWallet(
    message: ImportHdWalletReq
  ): Promise<ImportHdWalletRes> {
    try {
      const recoveryPhraseReference = await store
        .dispatch(importRecoveryPhrase(message.data))
        .unwrap();

      return {
        type: IMPORT_HD_WALLET_RESPONSE,
        data: {
          answered: true,
          phrase: recoveryPhraseReference,
        },
        error: null,
      };
    } catch (error) {
      if (error?.name === RecoveryPhraseExistErrorName) {
        const state = store.getState() as RootState;
        const phraseId = await getVault().getRecoveryPhraseId(
          state.vault.vaultSession.id,
          {
            passphrase: message.data.passphrase,
            recoveryPhrase: message.data.recoveryPhrase,
          }
        );

        return {
          type: IMPORT_HD_WALLET_RESPONSE,
          data: {
            answered: true,
            phraseAlreadyExists: true,
            phraseId,
            phrase: null,
          },
          error: null,
        };
      }

      return {
        type: IMPORT_HD_WALLET_RESPONSE,
        data: null,
        error: UnknownError,
      };
    }
  }

  private async _getRecoveryPhraseIdByPhrase(
    message: GetRecoveryPhraseIdReq
  ): Promise<GetRecoveryPhraseIdRes> {
    try {
      const { recoveryPhrase, passphrase } = message.data;

      const sessionId = (store.getState() as RootState).vault.vaultSession.id;

      const recoveryPhraseId = await getVault().getRecoveryPhraseId(sessionId, {
        recoveryPhrase,
        passphrase,
      });

      return {
        type: GET_RECOVERY_PHRASE_ID_RESPONSE,
        data: {
          recoveryPhraseId,
        },
        error: null,
      };
    } catch (e) {
      return {
        type: GET_RECOVERY_PHRASE_ID_RESPONSE,
        data: null,
        error: UnknownError,
      };
    }
  }

  private async _handleCreateAccountFromHdSeed(
    message: CreateAccountFromHdSeedReq
  ): Promise<CreateAccountFromHdSeedRes> {
    try {
      const { childAccount } = await store
        .dispatch(createNewAccountFromHdSeed(message.data))
        .unwrap();

      return {
        type: CREATE_ACCOUNT_FROM_HD_SEED_RESPONSE,
        data: {
          answered: true,
          account: childAccount,
        },
        error: null,
      };
    } catch (error) {
      return {
        type: CREATE_ACCOUNT_FROM_HD_SEED_RESPONSE,
        data: null,
        error: UnknownError,
      };
    }
  }

  private async _getPrivateKeyOfAccount({
    data,
  }: PrivateKeyAccountReq): Promise<PrivateKeyAccountRes> {
    try {
      const privateKey = await store
        .dispatch(getPrivateKeyOfAccount(data))
        .unwrap();

      return {
        type: PK_ACCOUNT_RESPONSE,
        data: {
          privateKey,
          answered: true,
        },
        error: null,
      };
    } catch (error) {
      if (error?.name === VaultRestoreErrorName) {
        return {
          type: PK_ACCOUNT_RESPONSE,
          data: {
            answered: true,
            isVaultPasswordWrong: true,
            privateKey: null,
          },
          error: null,
        };
      }

      return {
        type: PK_ACCOUNT_RESPONSE,
        data: null,
        error: UnknownError,
      };
    }
  }

  private async _getNetworkFee({
    data: { protocol, chainId, toAddress, asset, ...optionProps },
  }: NetworkFeeReq): Promise<NetworkFeeRes> {
    try {
      const { customRpcs, networks, errorsPreferredNetwork } =
        store.getState().app;

      const protocolService = ProtocolServiceFactory.getProtocolService(
        protocol,
        new WebEncryptionService()
      );

      const { result, rpcWithErrors } = await runWithNetworks(
        {
          protocol,
          chainId,
          customRpcs,
          networks,
          errorsPreferredNetwork,
        },
        async (network) => {
          return protocolService.getFee(
            network,
            // @ts-ignore
            protocol === SupportedProtocols.Ethereum
              ? {
                  protocol,
                  to: toAddress,
                  asset: asset
                    ? { ...asset, chainID: asset.chainId }
                    : undefined,
                  ...optionProps,
                }
              : protocol === SupportedProtocols.Cosmos
              ? {
                  protocol,
                  transaction: {
                    protocol,
                    transactionType: CosmosTransactionTypes.Send,
                    messages: [
                      {
                        type: CosmosTransactionTypes.Send,
                        payload: {
                          fromAddress: optionProps.from,
                          toAddress,
                          amount: "1",
                        },
                      },
                    ],
                    gasPrice: optionProps.defaultGasPrice,
                    gasEstimation: optionProps.defaultGasEstimation,
                  },
                }
              : undefined
          );
        }
      );

      if (rpcWithErrors.length) {
        await store.dispatch(setNetworksWithErrors(rpcWithErrors));
      }

      return {
        type: NETWORK_FEE_RESPONSE,
        data: {
          answered: true,
          networkFee: result,
        },
        error: null,
      };
    } catch (e) {
      return {
        type: NETWORK_FEE_RESPONSE,
        data: null,
        error: UnknownError,
      };
    }
  }

  private async _checkPermissionsForSession(
    message: CheckPermissionForSessionReq
  ): Promise<CheckPermissionForSessionRes> {
    try {
      const vault = getVault();

      let sessionIsValid: boolean;

      try {
        const { sessionId, resource, ids, action } = message?.data || {};
        await vault.validateSessionForPermissions(
          sessionId,
          resource,
          action,
          ids
        );
        sessionIsValid = true;
      } catch (e) {
        sessionIsValid = false;
      }

      return {
        type: CHECK_PERMISSION_FOR_SESSION_RESPONSE,
        data: {
          sessionIsValid,
        },
        error: null,
      };
    } catch (e) {
      return {
        type: CHECK_PERMISSION_FOR_SESSION_RESPONSE,
        data: null,
        error: UnknownError,
      };
    }
  }

  private async _updateBadgeText() {
    try {
      const numberOfRequests = store.getState().app.externalRequests.length;

      const badgeText = numberOfRequests ? `${numberOfRequests}` : "";

      await browser.action
        .setBadgeText({
          text: badgeText,
        })
        .catch();
    } catch (e) {}
  }

  private async _exportVault(message: ExportVaultReq): Promise<ExportVaultRes> {
    try {
      const { encryptionPassword, currentVaultPassword } = message.data;
      const response = await store
        .dispatch(
          exportVault({
            encryptionPassword,
            vaultPassword: currentVaultPassword,
          })
        )
        .unwrap();

      return {
        type: EXPORT_VAULT_RESPONSE,
        data: {
          vault: response.exportedVault,
          isPasswordWrong: false,
        },
        error: null,
      };
    } catch (e) {
      if (e?.name === VaultRestoreErrorName) {
        return {
          type: EXPORT_VAULT_RESPONSE,
          data: {
            isPasswordWrong: true,
            vault: null,
          },
          error: null,
        };
      }

      return {
        type: EXPORT_VAULT_RESPONSE,
        data: null,
        error: UnknownError,
      };
    }
  }

  private async _shouldExportVault(): Promise<ShouldExportVaultRes> {
    try {
      const { backupData, dateWhenInitialized } = store.getState().vault;
      const date = backupData?.lastDate || dateWhenInitialized || 0;
      const oneWeekInMs = 604800000;

      let shouldExportVault = false;

      try {
        const vault = getVault();
        const vaultContent = await vault
          .getEncryptedVault()
          .then((value) => value.contents);
        const vaultContentHashed = await hashString(
          JSON.stringify(vaultContent)
        );

        shouldExportVault =
          vaultContentHashed !== backupData?.vaultHash &&
          date + oneWeekInMs < Date.now();
      } catch (e) {}

      return {
        type: SHOULD_EXPORT_VAULT_RESPONSE,
        data: {
          hasVaultBeenExported: !!backupData,
          shouldExportVault,
        },
        error: null,
      };
    } catch (e) {
      return {
        type: SHOULD_EXPORT_VAULT_RESPONSE,
        data: null,
        error: UnknownError,
      };
    }
  }

  private async _importVault(message: ImportVaultReq): Promise<ImportVaultRes> {
    try {
      await store.dispatch(importVault(message.data)).unwrap();

      return {
        type: IMPORT_VAULT_RESPONSE,
        data: {
          answered: true,
          isPasswordWrong: false,
        },
        error: null,
      };
    } catch (e) {
      if (e?.name === VaultRestoreErrorName) {
        return {
          type: IMPORT_VAULT_RESPONSE,
          data: {
            answered: true,
            isPasswordWrong: true,
          },
          error: null,
        };
      }

      return {
        type: IMPORT_VAULT_RESPONSE,
        data: null,
        error: UnknownError,
      };
    }
  }

  private async _setRequirePasswordForOpts(
    message: SetRequirePasswordForOptsReq
  ): Promise<SetRequirePasswordForOptsRes> {
    try {
      const { id } = store.getState().vault.vaultSession;
      const password = await getVaultPassword(id);

      const { vaultPassword, enabled } = message.data;

      if (password !== vaultPassword) {
        return {
          type: SET_REQUIRE_PASSWORD_FOR_OPTS_RESPONSE,
          data: {
            answered: true,
            isPasswordWrong: true,
          },
          error: null,
        };
      }

      await store.dispatch(setRequirePasswordSensitiveOpts(enabled)).unwrap();

      return {
        type: SET_REQUIRE_PASSWORD_FOR_OPTS_RESPONSE,
        data: {
          answered: true,
          isPasswordWrong: false,
        },
        error: null,
      };
    } catch (e) {
      return {
        type: SET_REQUIRE_PASSWORD_FOR_OPTS_RESPONSE,
        data: null,
        error: UnknownError,
      };
    }
  }

  private async _getAccountPrivateKey(
    address: string,
    protocol: SupportedProtocols,
    sessionId: string
  ) {
    const vault = getVault();
    const vaultState = store.getState().vault;
    const vaultSessionId = vaultState.vaultSession.id;
    const serializedAccount = vaultState.accounts.find(
      (account) =>
        account.protocol === protocol &&
        account.address.toLowerCase() === address.toLowerCase()
    );
    const accountReference = AccountReference.deserialize(serializedAccount);
    const pass = await getVaultPassword(vaultSessionId);
    const passphrase = new Passphrase(pass);
    return vault.getAccountPrivateKey(sessionId, passphrase, accountReference);
  }
}

export default InternalCommunicationController;
