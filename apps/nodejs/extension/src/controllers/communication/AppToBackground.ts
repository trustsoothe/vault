import type {
  AnswerConnectionRequest,
  AnswerNewAccountRequest,
  UpdateAccountMessage,
  AnswerTransferRequest,
} from "./Internal";
import browser from "webextension-polyfill";
import {
  ANSWER_CONNECTION_REQUEST,
  ANSWER_NEW_ACCOUNT_REQUEST,
  ANSWER_TRANSFER_REQUEST,
  INITIALIZE_VAULT_REQUEST,
  LOCK_VAULT_REQUEST,
  REVOKE_SESSION_REQUEST,
  UNLOCK_VAULT_REQUEST,
  UPDATE_ACCOUNT_REQUEST,
} from "../../constants/communication";

export default class AppToBackground {
  static async answerConnection(data: AnswerConnectionRequest["data"]) {
    return browser.runtime.sendMessage({
      type: ANSWER_CONNECTION_REQUEST,
      data,
    });
  }

  static async answerNewAccount(data: AnswerNewAccountRequest["data"]) {
    return browser.runtime.sendMessage({
      type: ANSWER_NEW_ACCOUNT_REQUEST,
      data,
    });
  }

  static async updateAccount(data: UpdateAccountMessage["data"]) {
    return browser.runtime.sendMessage({
      type: UPDATE_ACCOUNT_REQUEST,
      data,
    });
  }

  static async sendRequestToAnswerTransfer(
    data: AnswerTransferRequest["data"]
  ) {
    return browser.runtime.sendMessage({
      type: ANSWER_TRANSFER_REQUEST,
      data,
    });
  }

  static async initializeVault(password: string) {
    return browser.runtime.sendMessage({
      type: INITIALIZE_VAULT_REQUEST,
      data: {
        password,
      },
    });
  }

  static async unlockVault(password: string) {
    return browser.runtime.sendMessage({
      type: UNLOCK_VAULT_REQUEST,
      data: {
        password,
      },
    });
  }

  static async lockVault() {
    return browser.runtime.sendMessage({
      type: LOCK_VAULT_REQUEST,
    });
  }

  static async revokeSession(sessionId: string) {
    return browser.runtime.sendMessage({
      type: REVOKE_SESSION_REQUEST,
      data: {
        sessionId,
      },
    });
  }
}
