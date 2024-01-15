import type {
  AccountBalanceMessage,
  AccountBalanceResponse,
  AnswerConnectionRequest,
  AnswerConnectionResponse,
  AnswerNewAccountRequest,
  AnswerNewAccountResponse,
  AnswerPersonalSignRequest,
  AnswerPersonalSignResponse,
  AnswerSignedTypedDataResponse,
  AnswerSwitchChainResponse,
  AnswerTransferRequest,
  AnswerTransferResponse,
  ExportVaultRequest,
  ExportVaultResponse,
  ImportAccountMessage,
  ImportAccountResponse,
  InitializeVaultRequest,
  InitializeVaultResponse,
  LockVaultMessage,
  LockVaultResponse,
  NetworkFeeMessage,
  NetworkFeeResponse,
  PrivateKeyAccountMessage,
  PrivateKeyAccountResponse,
  RemoveAccountMessage,
  RemoveAccountResponse,
  RevokeExternalSessionsMessage,
  RevokeExternalSessionsResponse,
  RevokeSessionMessage,
  RevokeSessionResponse,
  ShouldExportVaultRequest,
  ShouldExportVaultResponse,
  UnlockVaultRequest,
  UnlockVaultResponse,
  UpdateAccountMessage,
  UpdateAccountResponse,
} from "./Internal";
import {
  AnswerSignedTypedDataRequest,
  AnswerSwitchChainRequest,
  CheckPermissionForSessionMessage,
  CheckPermissionForSessionResponse,
} from "./Internal";
import browser from "webextension-polyfill";
import {
  ACCOUNT_BALANCE_REQUEST,
  ANSWER_CONNECTION_REQUEST,
  ANSWER_NEW_ACCOUNT_REQUEST,
  ANSWER_PERSONAL_SIGN_REQUEST,
  ANSWER_SIGNED_TYPED_DATA_REQUEST,
  ANSWER_SWITCH_CHAIN_REQUEST,
  ANSWER_TRANSFER_REQUEST,
  CHECK_PERMISSION_FOR_SESSION_REQUEST,
  EXPORT_VAULT_REQUEST,
  IMPORT_ACCOUNT_REQUEST,
  INITIALIZE_VAULT_REQUEST,
  LOCK_VAULT_REQUEST,
  NETWORK_FEE_REQUEST,
  PK_ACCOUNT_REQUEST,
  REMOVE_ACCOUNT_REQUEST,
  REVOKE_EXTERNAL_SESSIONS_REQUEST,
  REVOKE_SESSION_REQUEST,
  SHOULD_EXPORT_VAULT_REQUEST,
  UNLOCK_VAULT_REQUEST,
  UPDATE_ACCOUNT_REQUEST,
} from "../../constants/communication";

export default class AppToBackground {
  static async answerConnection(
    data: AnswerConnectionRequest["data"]
  ): Promise<AnswerConnectionResponse> {
    return browser.runtime.sendMessage({
      type: ANSWER_CONNECTION_REQUEST,
      data,
    } as AnswerConnectionRequest);
  }

  static async answerNewAccount(
    data: AnswerNewAccountRequest["data"]
  ): Promise<AnswerNewAccountResponse> {
    return browser.runtime.sendMessage({
      type: ANSWER_NEW_ACCOUNT_REQUEST,
      data,
    } as AnswerNewAccountRequest);
  }

  static async importAccount(
    data: ImportAccountMessage["data"]
  ): Promise<ImportAccountResponse> {
    const message: ImportAccountMessage = {
      type: IMPORT_ACCOUNT_REQUEST,
      data,
    };

    return browser.runtime.sendMessage(message);
  }

  static async updateAccount(
    data: UpdateAccountMessage["data"]
  ): Promise<UpdateAccountResponse> {
    return browser.runtime.sendMessage({
      type: UPDATE_ACCOUNT_REQUEST,
      data,
    } as UpdateAccountMessage);
  }

  static async removeAccount(
    data: RemoveAccountMessage["data"]
  ): Promise<RemoveAccountResponse> {
    const message: RemoveAccountMessage = {
      type: REMOVE_ACCOUNT_REQUEST,
      data,
    };
    return browser.runtime.sendMessage(message);
  }

  static async getAccountPrivateKey(
    data: PrivateKeyAccountMessage["data"]
  ): Promise<PrivateKeyAccountResponse> {
    const message: PrivateKeyAccountMessage = {
      type: PK_ACCOUNT_REQUEST,
      data,
    };

    return browser.runtime.sendMessage(message);
  }

  static async sendRequestToAnswerTransfer(
    data: AnswerTransferRequest["data"]
  ): Promise<AnswerTransferResponse> {
    return browser.runtime.sendMessage({
      type: ANSWER_TRANSFER_REQUEST,
      data,
    } as AnswerTransferRequest);
  }

  static async initializeVault(
    password: string,
    rememberPass: boolean
  ): Promise<InitializeVaultResponse> {
    return browser.runtime.sendMessage({
      type: INITIALIZE_VAULT_REQUEST,
      data: {
        password,
        remember: rememberPass,
      },
    } as InitializeVaultRequest);
  }

  static async unlockVault(
    password: string,
    rememberPass: boolean
  ): Promise<UnlockVaultResponse> {
    return browser.runtime.sendMessage({
      type: UNLOCK_VAULT_REQUEST,
      data: {
        password,
        remember: rememberPass,
      },
    } as UnlockVaultRequest);
  }

  static async lockVault(): Promise<LockVaultResponse> {
    return browser.runtime.sendMessage({
      type: LOCK_VAULT_REQUEST,
    } as LockVaultMessage);
  }

  static async revokeSession(
    sessionId: string
  ): Promise<RevokeSessionResponse> {
    return browser.runtime.sendMessage({
      type: REVOKE_SESSION_REQUEST,
      data: {
        sessionId,
      },
    } as RevokeSessionMessage);
  }

  static async revokeAllExternalSessions(): Promise<RevokeExternalSessionsResponse> {
    return browser.runtime.sendMessage({
      type: REVOKE_EXTERNAL_SESSIONS_REQUEST,
    } as RevokeExternalSessionsMessage);
  }

  static async getAccountBalance(
    data: AccountBalanceMessage["data"]
  ): Promise<AccountBalanceResponse> {
    const message: AccountBalanceMessage = {
      type: ACCOUNT_BALANCE_REQUEST,
      data,
    };
    return browser.runtime.sendMessage(message);
  }

  static async getNetworkFee(
    data: NetworkFeeMessage["data"]
  ): Promise<NetworkFeeResponse> {
    const message: NetworkFeeMessage = {
      type: NETWORK_FEE_REQUEST,
      data,
    };
    return browser.runtime.sendMessage(message);
  }

  static async checkPermissionForSession(
    data: CheckPermissionForSessionMessage["data"]
  ): Promise<CheckPermissionForSessionResponse> {
    const message: CheckPermissionForSessionMessage = {
      type: CHECK_PERMISSION_FOR_SESSION_REQUEST,
      data,
    };
    return browser.runtime.sendMessage(message);
  }

  static async answerSwitchChain(
    data: AnswerSwitchChainRequest["data"]
  ): Promise<AnswerSwitchChainResponse> {
    const message: AnswerSwitchChainRequest = {
      type: ANSWER_SWITCH_CHAIN_REQUEST,
      data,
    };
    return browser.runtime.sendMessage(message);
  }

  static async answerSignTypedData(
    data: AnswerSignedTypedDataRequest["data"]
  ): Promise<AnswerSignedTypedDataResponse> {
    const message: AnswerSignedTypedDataRequest = {
      type: ANSWER_SIGNED_TYPED_DATA_REQUEST,
      data,
    };

    return browser.runtime.sendMessage(message);
  }

  static async answerPersonalSign(
    data: AnswerPersonalSignRequest["data"]
  ): Promise<AnswerPersonalSignResponse> {
    const message: AnswerPersonalSignRequest = {
      data,
      type: ANSWER_PERSONAL_SIGN_REQUEST,
    };

    return browser.runtime.sendMessage(message);
  }

  static async exportVault(
    data: ExportVaultRequest["data"] = undefined
  ): Promise<ExportVaultResponse> {
    const message: ExportVaultRequest = {
      type: EXPORT_VAULT_REQUEST,
      data,
    };

    return browser.runtime.sendMessage(message);
  }

  static async shouldExportVault(): Promise<ShouldExportVaultResponse> {
    const message: ShouldExportVaultRequest = {
      type: SHOULD_EXPORT_VAULT_REQUEST,
    };

    return browser.runtime.sendMessage(message);
  }
}
