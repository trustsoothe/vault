import type {
  AnswerConnectionRequest,
  AnswerNewAccountRequest,
} from "./Internal";
import browser from "webextension-polyfill";
import {
  ANSWER_CONNECTION_REQUEST,
  ANSWER_NEW_ACCOUNT_REQUEST,
  ANSWER_TRANSFER_REQUEST,
} from "../../constants/communication";
import { AnswerTransferRequest } from "./Internal";

export default class AppToBackground {
  static async sendRequestToAnswerConnection(
    data: AnswerConnectionRequest["data"]
  ) {
    return browser.runtime.sendMessage({
      type: ANSWER_CONNECTION_REQUEST,
      data,
    });
  }

  static async sendRequestToAnswerNewAccount(
    data: AnswerNewAccountRequest["data"]
  ) {
    return browser.runtime.sendMessage({
      type: ANSWER_NEW_ACCOUNT_REQUEST,
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
}
