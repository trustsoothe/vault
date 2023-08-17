import type {
  AnswerConnectionRequest,
  AnswerConnectionResponse,
  AnswerNewAccountRequest,
  AnswerNewAccountResponse,
  AnswerTransferRequest,
  AnswerTransferResponse,
  ImportAccountMessage,
  ImportAccountResponse,
  InitializeVaultRequest,
  InitializeVaultResponse,
  LockVaultMessage,
  LockVaultResponse,
  PrivateKeyAccountMessage,
  PrivateKeyAccountResponse,
  RemoveAccountMessage,
  RemoveAccountResponse,
  RevokeSessionMessage,
  RevokeSessionResponse,
  UnlockVaultRequest,
  UnlockVaultResponse,
  UpdateAccountMessage,
  UpdateAccountResponse,
} from "./Internal";
import browser from "webextension-polyfill";
import {
  ANSWER_CONNECTION_REQUEST,
  ANSWER_NEW_ACCOUNT_REQUEST,
  ANSWER_TRANSFER_REQUEST,
  IMPORT_ACCOUNT_REQUEST,
  INITIALIZE_VAULT_REQUEST,
  LOCK_VAULT_REQUEST,
  PK_ACCOUNT_REQUEST,
  REMOVE_ACCOUNT_REQUEST,
  REVOKE_SESSION_REQUEST,
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
}
