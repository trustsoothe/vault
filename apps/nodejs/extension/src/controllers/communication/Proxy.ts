import type { Permission } from "@poktscan/keyring";
import type {
  ProxyCheckConnectionRequest,
  ProxyConnectionRequest,
  ProxyDisconnectRequest,
  ProxyListAccountsRequest,
  ProxyNewAccountRequest,
  ProxyTransferRequest,
} from "../../types/communication";
import {
  ConnectionRequestMessage,
  DisconnectRequestMessage,
  ListAccountsRequestMessage,
  NewAccountRequestMessage,
  SessionValidRequestMessage,
  TransferRequestMessage,
} from "../../types/communication";
// Controller to manage the communication between the webpages and the content script
import browser from "webextension-polyfill";
import { z, ZodError } from "zod";
import {
  CHECK_CONNECTION_REQUEST,
  CONNECTION_REQUEST_MESSAGE,
  CONNECTION_RESPONSE_MESSAGE,
  DISCONNECT_REQUEST,
  DISCONNECT_RESPONSE,
  IS_SESSION_VALID_REQUEST,
  IS_SESSION_VALID_RESPONSE,
  LIST_ACCOUNTS_REQUEST,
  LIST_ACCOUNTS_RESPONSE,
  NEW_ACCOUNT_REQUEST,
  NEW_ACCOUNT_RESPONSE,
  TRANSFER_REQUEST,
  TRANSFER_RESPONSE,
} from "../../constants/communication";
import {
  AmountNotPresented,
  AmountNotValid,
  ForbiddenSession,
  FromAddressNotPresented,
  FromAddressNotValid,
  InvalidBody,
  InvalidPermission,
  InvalidSession,
  NotConnected,
  OriginNotPresented,
  RequestConnectionExists,
  RequestNewAccountExists,
  RequestTransferExists,
  SessionIdNotPresented,
  ToAddressNotPresented,
  ToAddressNotValid,
} from "../../errors/communication";
import { isHex } from "../../utils";

const id = "ihemdpidnelcmpnndlfkhkebmbgjnehb";

interface Session {
  id: string;
  permissions: Permission[];
  maxAge: number;
  createdAt: number;
}

type ConnectionError =
  | null
  | typeof OriginNotPresented
  | typeof RequestConnectionExists
  | typeof InvalidPermission;

interface ConnectionResponse {
  type: typeof CONNECTION_RESPONSE_MESSAGE;
  data: {
    accepted: boolean;
    session: Session | null;
  } | null;
  error: ConnectionError;
}

type IsSessionValidError = null | typeof SessionIdNotPresented;

interface IsSessionValidResponse {
  type: typeof IS_SESSION_VALID_RESPONSE;
  data: {
    isValid: boolean;
  } | null;
  error: IsSessionValidError;
}

type NewAccountError =
  | typeof SessionIdNotPresented
  | typeof InvalidSession
  | typeof ForbiddenSession
  | typeof OriginNotPresented
  | typeof RequestNewAccountExists
  | typeof NotConnected
  | null;

type TransferError =
  | typeof SessionIdNotPresented
  | typeof InvalidSession
  | typeof ForbiddenSession
  | typeof OriginNotPresented
  | typeof RequestTransferExists
  | typeof AmountNotPresented
  | typeof ToAddressNotPresented
  | typeof FromAddressNotPresented
  | typeof NotConnected
  | typeof InvalidBody
  | typeof AmountNotValid
  | typeof FromAddressNotValid
  | typeof ToAddressNotValid
  | null;

interface NewAccountResponse {
  type: typeof NEW_ACCOUNT_RESPONSE;
  data: {
    rejected: boolean;
    address: string | null;
  } | null;
  error: NewAccountError;
}

interface TransferResponse {
  type: typeof TRANSFER_RESPONSE;
  data: {
    rejected: boolean;
    hash: string | null;
  } | null;
  error: TransferError;
}

interface DisconnectResponse {
  type: typeof DISCONNECT_RESPONSE;
  data: {
    disconnected: true;
  };
  error: null;
}

type ExtensionResponses =
  | ConnectionResponse
  | NewAccountResponse
  | TransferResponse
  | DisconnectResponse;

export type TPermissionsAllowedToSuggest = z.infer<
  typeof PermissionsAllowedToSuggest
>;

export type TTransferRequestBody = z.infer<typeof TransferRequestBody>;

type BrowserRequest =
  | ProxyConnectionRequest
  | ProxyCheckConnectionRequest
  | ProxyNewAccountRequest
  | ProxyTransferRequest
  | ProxyDisconnectRequest
  | ProxyListAccountsRequest;

const TransferRequestBody = z.object({
  toAddress: z
    .string()
    .length(40)
    .refine(isHex, "toAddress is not a valid address"),
  fromAddress: z
    .string()
    .length(40)
    .refine(isHex, "fromAddress is not a valid address"),
  amount: z.number().min(0.01),
});

const PermissionsAllowedToSuggest = z.array(
  z.union([
    z.literal("list_accounts"),
    z.literal("create_accounts"),
    z.literal("suggest_transfer"),
  ])
);

class ProxyCommunicationController {
  private _session: Session | null = null;

  constructor() {
    this._checkLastSession();

    window.addEventListener(
      "message",
      async (event: MessageEvent<BrowserRequest>) => {
        const { data, origin } = event;

        if (origin === window.location.origin && data?.to === "VAULT_KEYRING") {
          if (data?.type === CONNECTION_REQUEST_MESSAGE) {
            await this._sendConnectionRequest(data.suggestedPermissions);
          }

          if (data?.type === CHECK_CONNECTION_REQUEST) {
            await this._checkConnectionResponse();
          }

          if (data?.type === NEW_ACCOUNT_REQUEST) {
            await this._sendNewAccountRequest();
          }

          if (data?.type === TRANSFER_REQUEST) {
            await this._sendTransferRequest(data.data);
          }

          if (data?.type === DISCONNECT_REQUEST) {
            await this._handleDisconnectRequest();
          }

          if (data?.type === LIST_ACCOUNTS_REQUEST) {
            await this._handleListAccountsRequest();
          }

          // @ts-ignore
          if (data?.type === "LOG_SESSION") {
            console.log(this._session);
          }
        }
      }
    );

    browser.runtime.onMessage.addListener(
      async (message: ExtensionResponses, sender) => {
        if (sender.id === id) {
          if (message?.type === CONNECTION_RESPONSE_MESSAGE) {
            await this._handleConnectionResponse(message);
          }

          if (message?.type === NEW_ACCOUNT_RESPONSE) {
            await this._handleNewAccountResponse(message);
          }

          if (message?.type === TRANSFER_RESPONSE) {
            await this._handleTransferResponse(message);
          }

          if (message?.type === DISCONNECT_RESPONSE) {
            if (message.data.disconnected) {
              this._sendDisconnectResponse(
                message.data.disconnected,
                message.error
              );
            }
          }

          return "RECEIVED";
        } else {
          return "NOT_FOR_ME";
        }
      }
    );
  }

  private _getFaviconUrl() {
    let faviconUrl: string;
    const faviconFromSelector: HTMLAnchorElement = document.querySelector(
      "link[rel*='icon']"
    );

    if (faviconFromSelector) {
      faviconUrl = faviconFromSelector.href;
    }
    return faviconUrl || "";
  }

  private async _sendConnectionRequest(
    suggestedPermissions: TPermissionsAllowedToSuggest
  ) {
    let permissionsToSuggest: TPermissionsAllowedToSuggest;
    if (suggestedPermissions) {
      try {
        permissionsToSuggest =
          PermissionsAllowedToSuggest.parse(suggestedPermissions);
      } catch (e) {
        return this._sendConnectionResponse(false, InvalidPermission);
      }
    }

    const message: ConnectionRequestMessage = {
      type: CONNECTION_REQUEST_MESSAGE,
      data: {
        origin: window.location.origin,
        faviconUrl: this._getFaviconUrl(),
        suggestedPermissions: permissionsToSuggest,
      },
    };

    const response = await browser.runtime.sendMessage(message);

    console.log("RESPONSE:", response);

    if (response?.type === CONNECTION_RESPONSE_MESSAGE) {
      await this._handleConnectionResponse(response);
    }
  }

  private async _handleConnectionResponse(
    extensionResponse: ConnectionResponse
  ) {
    console.log(extensionResponse);
    const { error, data } = extensionResponse;

    if (data) {
      const { accepted, session } = data;

      if (accepted && session) {
        this._session = session;

        await browser.storage.local.set({
          [`${window.location.origin}-session`]: session,
        });

        this._sendConnectionResponse(true);
      } else {
        this._sendConnectionResponse(false);
      }
    } else {
      this._sendConnectionResponse(false, error);
    }
  }

  private _sendConnectionResponse(
    connectionEstablished: boolean,
    error: ConnectionError | IsSessionValidError = null
  ) {
    let permissions: TPermissionsAllowedToSuggest;

    if (connectionEstablished) {
      permissions = this._returnPermissions();
    }

    window.postMessage({
      from: "VAULT_KEYRING",
      type: CONNECTION_RESPONSE_MESSAGE,
      data: {
        connectionEstablished,
        permissions,
      },
      error,
    });
  }

  private _checkLastSession() {
    browser.storage.local
      .get({ [`${window.location.origin}-session`]: null })
      .then(async (response) => {
        const session: Session = response[`${window.location.origin}-session`];

        if (session) {
          const message: SessionValidRequestMessage = {
            type: IS_SESSION_VALID_REQUEST,
            data: {
              sessionId: session.id,
            },
          };

          const messageResponse: IsSessionValidResponse =
            await browser.runtime.sendMessage(message);
          if (
            messageResponse?.type === IS_SESSION_VALID_RESPONSE &&
            messageResponse?.data
          ) {
            const isValid = messageResponse?.data?.isValid;

            if (isValid) {
              this._session = session;
              this._sendConnectionResponse(true);
            } else {
              if (typeof isValid === "boolean") {
                await browser.storage.local.remove(
                  `${window.location.origin}-session`
                );
              }
            }
          }
        }
      });
  }

  private async _checkConnectionResponse() {
    let connected = false,
      error: IsSessionValidError = null;

    if (this._session) {
      const messageResponse: IsSessionValidResponse =
        await browser.runtime.sendMessage({
          type: IS_SESSION_VALID_REQUEST,
          data: {
            sessionId: this._session.id,
          },
        });

      connected = messageResponse?.data?.isValid || false;
      error = messageResponse?.error;

      if (!connected) {
        this._session = null;
      }
    }

    this._sendConnectionResponse(connected, error);
  }

  private _returnPermissions(): TPermissionsAllowedToSuggest | null {
    if (this._session) {
      const permissions: TPermissionsAllowedToSuggest = [];

      for (const { resource, action } of this._session.permissions) {
        if (resource === "transaction" && action === "sign") {
          permissions.push("suggest_transfer");
          continue;
        }

        if (resource === "account" && action === "create") {
          permissions.push("create_accounts");
          continue;
        }

        if (resource === "account" && action === "read") {
          permissions.push("list_accounts");
        }
      }

      return permissions;
    }

    return null;
  }

  private async _sendNewAccountRequest() {
    if (this._session) {
      const message: NewAccountRequestMessage = {
        type: NEW_ACCOUNT_REQUEST,
        data: {
          origin: window.location.origin,
          faviconUrl: this._getFaviconUrl(),
          sessionId: this._session.id,
        },
      };
      const response = await browser.runtime.sendMessage(message);

      console.log("RESPONSE:", response);

      if (response?.type === NEW_ACCOUNT_RESPONSE) {
        await this._handleNewAccountResponse(response);
      }
    } else {
      return this._sendNewAccountResponse(true, null, NotConnected);
    }
  }

  private async _handleNewAccountResponse(response: NewAccountResponse) {
    console.log(response);
    const { error, data } = response;

    if (data) {
      const { rejected, address } = data;

      this._sendNewAccountResponse(rejected, address);
    } else {
      this._sendNewAccountResponse(false, null, error);
    }
  }

  private _sendNewAccountResponse(
    rejected: boolean,
    address: string = null,
    error: NewAccountError = null
  ) {
    window.postMessage({
      from: "VAULT_KEYRING",
      type: NEW_ACCOUNT_RESPONSE,
      data: {
        rejected,
        address,
      },
      error,
    });
  }

  private async _sendTransferRequest(data: ProxyTransferRequest["data"]) {
    if (this._session) {
      let { fromAddress, toAddress, amount } = data || {};

      if (!fromAddress) {
        return this._sendTransferResponse(true, null, FromAddressNotPresented);
      }

      if (!toAddress) {
        return this._sendTransferResponse(true, null, ToAddressNotPresented);
      }

      if (!amount) {
        return this._sendTransferResponse(true, null, AmountNotPresented);
      }

      try {
        TransferRequestBody.parse(data);
      } catch (e) {
        const zodError: ZodError = e;
        const path = zodError?.issues?.[0]?.path?.[0];

        switch (path) {
          case "toAddress": {
            return this._sendTransferResponse(true, null, ToAddressNotValid);
          }
          case "fromAddress": {
            return this._sendTransferResponse(true, null, FromAddressNotValid);
          }
          case "amount": {
            return this._sendTransferResponse(true, null, AmountNotValid);
          }
          default: {
            return this._sendTransferResponse(true, null, InvalidBody);
          }
        }
      }

      const message: TransferRequestMessage = {
        type: TRANSFER_REQUEST,
        data: {
          origin: window.location.origin,
          faviconUrl: this._getFaviconUrl(),
          sessionId: this._session.id,
          fromAddress,
          toAddress,
          amount,
        },
      };

      const response = await browser.runtime.sendMessage(message);

      console.log("RESPONSE:", response);

      if (response?.type === TRANSFER_RESPONSE) {
        await this._handleTransferResponse(response);
      }
    } else {
      return this._sendTransferResponse(true, null, NotConnected);
    }
  }

  private async _handleTransferResponse(response: TransferResponse) {
    console.log(response);
    const { error, data } = response;

    if (data) {
      const { rejected, hash } = data;

      this._sendTransferResponse(rejected, hash);
    } else {
      this._sendTransferResponse(false, null, error);
    }
  }

  private _sendTransferResponse(
    rejected: boolean,
    hash: string = null,
    error: TransferError = null
  ) {
    window.postMessage({
      from: "VAULT_KEYRING",
      type: TRANSFER_RESPONSE,
      data: {
        rejected,
        hash,
      },
      error,
    });
  }

  private async _handleDisconnectRequest() {
    if (this._session) {
      const message: DisconnectRequestMessage = {
        type: DISCONNECT_REQUEST,
        data: {
          sessionId: this._session.id,
        },
      };
      const response = await browser.runtime.sendMessage(message);

      console.log("RESPONSE:", response);

      const disconnected = response?.data?.disconnected;

      if (disconnected) {
        this._session = null;
      }

      this._sendDisconnectResponse(disconnected, response?.error || null);
    } else {
      this._sendDisconnectResponse(false, NotConnected);
    }
  }

  private _sendDisconnectResponse(disconnect: boolean, error = null) {
    if (disconnect) {
      this._session = null;
    }

    window.postMessage({
      from: "VAULT_KEYRING",
      type: DISCONNECT_RESPONSE,
      data: disconnect
        ? {
            disconnect,
          }
        : null,
      error,
    });
  }

  private async _handleListAccountsRequest() {
    if (this._session) {
      const message: ListAccountsRequestMessage = {
        type: LIST_ACCOUNTS_REQUEST,
        data: {
          sessionId: this._session.id,
        },
      };
      const response = await browser.runtime.sendMessage(message);

      const accounts = response?.data?.accounts;
      const data = accounts
        ? {
            accounts,
          }
        : null;

      window.postMessage({
        from: "VAULT_KEYRING",
        type: LIST_ACCOUNTS_REQUEST,
        data,
        error: response?.error || null,
      });
    } else {
      window.postMessage({
        from: "VAULT_KEYRING",
        type: LIST_ACCOUNTS_RESPONSE,
        data: null,
        error: NotConnected,
      });
    }
  }
}

export default ProxyCommunicationController;
