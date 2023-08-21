import type { BrowserRequest, BrowserResponse } from "../../types";
import type {
  ProxyCheckConnectionRequest,
  ProxyConnectionRequest,
  ProxyConnectionRes,
  ProxyDisconnectRequest,
  ProxyDisconnectRes,
  ProxyListAccountsRequest,
  ProxyListAccountsRes,
  ProxyNewAccountRequest,
  ProxyNewAccountRes,
  ProxyTransferRequest,
  ProxyTransferRes,
} from "../../types/communication";
import {
  CHECK_CONNECTION_REQUEST,
  CONNECTION_REQUEST_MESSAGE,
  CONNECTION_RESPONSE_MESSAGE,
  DISCONNECT_REQUEST,
  DISCONNECT_RESPONSE,
  LIST_ACCOUNTS_REQUEST,
  LIST_ACCOUNTS_RESPONSE,
  MINUTES_ALLOWED_FOR_REQ,
  NEW_ACCOUNT_REQUEST,
  NEW_ACCOUNT_RESPONSE,
  TRANSFER_REQUEST,
  TRANSFER_RESPONSE,
} from "../../constants/communication";
import { RequestTimeout } from "../../errors/communication";

interface ExtensionResponse {
  data: BrowserResponse["data"];
  error: BrowserResponse["error"];
}

export default class Provider {
  async connect() {
    return _baseRequest(CONNECTION_REQUEST_MESSAGE, undefined);
  }

  async disconnect() {
    return _baseRequest(DISCONNECT_REQUEST, undefined);
  }

  async checkConnection() {
    return _baseRequest(CHECK_CONNECTION_REQUEST, undefined);
  }

  async listAccounts() {
    return _baseRequest(LIST_ACCOUNTS_REQUEST, undefined);
  }

  async createAccount(data: ProxyNewAccountRequest["data"]) {
    return _baseRequest(NEW_ACCOUNT_REQUEST, data);
  }

  async suggestTransfer(data: ProxyTransferRequest["data"]) {
    return _baseRequest(TRANSFER_REQUEST, data);
  }
}

async function _baseRequest(
  type: ProxyConnectionRequest["type"],
  data: undefined
): Promise<ProxyConnectionRes>;
async function _baseRequest(
  type: ProxyCheckConnectionRequest["type"],
  data: undefined
): Promise<ProxyConnectionRes>;
async function _baseRequest(
  type: ProxyNewAccountRequest["type"],
  data: ProxyNewAccountRequest["data"]
): Promise<ProxyNewAccountRes>;
async function _baseRequest(
  type: ProxyTransferRequest["type"],
  data: ProxyTransferRequest["data"]
): Promise<ProxyTransferRes>;
async function _baseRequest(
  type: ProxyDisconnectRequest["type"],
  data: undefined
): Promise<ProxyDisconnectRes>;
async function _baseRequest(
  type: ProxyListAccountsRequest["type"],
  data: undefined
): Promise<ProxyListAccountsRes>;
async function _baseRequest<T extends BrowserRequest["type"]>(
  type: T,
  data: BrowserRequest["data"] | ProxyTransferRequest["data"]
): Promise<ExtensionResponse> {
  let responseType: BrowserResponse["type"];

  switch (type) {
    case CHECK_CONNECTION_REQUEST:
      responseType = CONNECTION_RESPONSE_MESSAGE;
      break;
    case CONNECTION_REQUEST_MESSAGE:
      responseType = CONNECTION_RESPONSE_MESSAGE;
      break;
    case NEW_ACCOUNT_REQUEST:
      responseType = NEW_ACCOUNT_RESPONSE;
      break;
    case TRANSFER_REQUEST:
      responseType = TRANSFER_RESPONSE;
      break;
    case DISCONNECT_REQUEST:
      responseType = DISCONNECT_RESPONSE;
      break;
    case LIST_ACCOUNTS_REQUEST:
      responseType = LIST_ACCOUNTS_RESPONSE;
      break;
  }

  window.postMessage(
    {
      type,
      data,
      to: "VAULT_KEYRING",
    } as BrowserRequest,
    window.location.origin
  );

  return new Promise((resolve) => {
    const listener = (event: MessageEvent<BrowserResponse>) => {
      if (
        responseType === event.data.type &&
        event.origin === window.location.origin &&
        event.source === window &&
        event.data?.from === "VAULT_KEYRING"
      ) {
        window.removeEventListener("message", listener);
        resolve({
          data: event.data.data,
          error: event.data.error,
        });
      }
    };

    window.addEventListener("message", listener);

    setTimeout(() => {
      window.removeEventListener("message", listener);
      resolve({
        data: null,
        error: RequestTimeout,
      });
    }, (MINUTES_ALLOWED_FOR_REQ + 1) * 60000);
  });
}
