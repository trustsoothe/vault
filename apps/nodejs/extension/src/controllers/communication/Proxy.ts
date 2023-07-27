import type { Permission } from "@poktscan/keyring";
import type {
  ExternalListAccountsResponse,
  InternalTransferResponse,
  ProxyCheckConnectionRequest,
  ProxyConnectionRequest,
  ProxyDisconnectRequest,
  ProxyListAccountsRequest,
  ProxyNewAccountRequest,
  ProxyTransferRequest,
} from "../../types/communication";
import type {
  ConnectionRequestMessage,
  ConnectionResponseFromBack,
  DisconnectBackResponse,
  DisconnectRequestMessage,
  ExternalConnectionResOnProxy,
  ExternalNewAccountResOnProxy,
  ExternalTransferResOnProxy,
  IsSessionValidRequestErrors,
  IsSessionValidResponse,
  ListAccountsRequestMessage,
  NewAccountRequestMessage,
  NewAccountResponseFromBack,
  ProxyConnectionErrors,
  ProxyConnectionRes,
  ProxyDisconnectErrors,
  ProxyDisconnectRes,
  ProxyListAccountsRes,
  ProxyNewAccountRequestErrors,
  ProxyNewAccountRes,
  ProxyTransferError,
  ProxyTransferRes,
  SessionValidRequestMessage,
  TransferRequestMessage,
  TransferResponseFromBack,
} from "../../types/communication";
import type { ChainID } from "@poktscan/keyring/dist/lib/core/common/IProtocol";
import browser from "webextension-polyfill";
import { z, ZodError } from "zod";
import { SupportedProtocols } from "@poktscan/keyring";
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
  FromAddressNotPresented,
  FromAddressNotValid,
  InvalidBody,
  InvalidPermission,
  InvalidProtocol,
  MemoNotValid,
  NotConnected,
  ToAddressNotPresented,
  ToAddressNotValid,
  UnknownError,
} from "../../errors/communication";
import { isHex } from "../../utils";
import { chainIDsByProtocol } from "../../constants/protocols";

const id = "ihemdpidnelcmpnndlfkhkebmbgjnehb";

interface Session {
  id: string;
  permissions: Permission[];
  maxAge: number;
  createdAt: number;
}

interface DisconnectResponse {
  type: typeof DISCONNECT_RESPONSE;
  data: {
    disconnected: true;
  };
  error: null;
}

type ExtensionResponses =
  | ConnectionResponseFromBack
  | NewAccountResponseFromBack
  | TransferResponseFromBack
  | DisconnectResponse;

export type TPermissionsAllowedToSuggest = z.infer<
  typeof PermissionsAllowedToSuggest
>;

export type TProtocol = z.infer<typeof Protocol>;

export type TTransferRequestBody = z.infer<typeof TransferRequestBody>;

type BrowserRequest =
  | ProxyConnectionRequest
  | ProxyCheckConnectionRequest
  | ProxyNewAccountRequest
  | ProxyTransferRequest
  | ProxyDisconnectRequest
  | ProxyListAccountsRequest;

const protocolsArr = Object.values(SupportedProtocols);

const Protocol = z
  .object({
    name: z.enum([protocolsArr[0], ...protocolsArr.slice(1)]),
    chainID: z.string(),
  })
  .strict()
  .refine(
    ({ name, chainID }) =>
      chainIDsByProtocol[name].includes(chainID as ChainID<SupportedProtocols>),
    "Invalid Protocol"
  )
  .optional();

const TransferRequestBody = z
  .object({
    toAddress: z
      .string()
      .toLowerCase()
      .length(40)
      .refine(isHex, "toAddress is not a valid address"),
    fromAddress: z
      .string()
      .toLowerCase()
      .length(40)
      .refine(isHex, "fromAddress is not a valid address"),
    amount: z.number().min(0.01),
    memo: z.string().trim().max(50).optional(),
    protocol: Protocol,
  })
  .strict();

const PermissionsAllowedToSuggest = z.array(
  z.union([
    z.literal("list_accounts"),
    z.literal("create_accounts"),
    z.literal("suggest_transfer"),
  ])
);

// Controller to manage the communication between the webpages and the content script
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
            await this._sendConnectionRequest(data.data?.suggestedPermissions);
          }

          if (data?.type === CHECK_CONNECTION_REQUEST) {
            await this._checkConnectionResponse();
          }

          if (data?.type === NEW_ACCOUNT_REQUEST) {
            await this._sendNewAccountRequest(data.data);
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
    suggestedPermissions?: TPermissionsAllowedToSuggest
  ) {
    let requestWasSent = false;
    try {
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

      const response: ExternalConnectionResOnProxy =
        await browser.runtime.sendMessage(message);
      requestWasSent = true;

      console.log("RESPONSE:", response);

      if (response?.type === CONNECTION_RESPONSE_MESSAGE) {
        await this._handleConnectionResponse(response);
      }
    } catch (e) {
      if (!requestWasSent) {
        this._sendConnectionResponse(false, UnknownError);
      }
    }
  }

  private async _handleConnectionResponse(
    extensionResponse: ConnectionResponseFromBack
  ) {
    try {
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
    } catch (e) {
      this._sendConnectionResponse(false, UnknownError);
    }
  }

  private _sendConnectionResponse(
    connectionEstablished: boolean,
    error: ProxyConnectionErrors = null
  ) {
    try {
      let response: ProxyConnectionRes;

      if (error) {
        response = {
          type: CONNECTION_RESPONSE_MESSAGE,
          from: "VAULT_KEYRING",
          data: null,
          error,
        };
      } else {
        let permissions: TPermissionsAllowedToSuggest;
        if (connectionEstablished) {
          permissions = this._returnPermissions();
        }

        response = {
          type: CONNECTION_RESPONSE_MESSAGE,
          from: "VAULT_KEYRING",
          error: null,
          data: {
            connectionEstablished,
            permissions,
          },
        };
      }

      window.postMessage(response);
    } catch (e) {
      window.postMessage({
        type: CONNECTION_RESPONSE_MESSAGE,
        from: "VAULT_KEYRING",
        data: null,
        error: UnknownError,
      } as ProxyConnectionRes);
    }
  }

  private _checkLastSession() {
    try {
      browser.storage.local
        .get({ [`${window.location.origin}-session`]: null })
        .then(async (response) => {
          const session: Session =
            response[`${window.location.origin}-session`];

          if (session) {
            const message: SessionValidRequestMessage = {
              type: IS_SESSION_VALID_REQUEST,
              data: {
                sessionId: session.id,
                origin: window.location.origin,
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
    } catch (e) {}
  }

  private async _checkConnectionResponse() {
    try {
      let connected = false,
        error: IsSessionValidRequestErrors;

      if (this._session) {
        const message: SessionValidRequestMessage = {
          type: IS_SESSION_VALID_REQUEST,
          data: {
            sessionId: this._session.id,
            origin: window.location.origin,
          },
        };

        const messageResponse: IsSessionValidResponse =
          await browser.runtime.sendMessage(message);

        connected = messageResponse?.data?.isValid || false;
        error = messageResponse?.error;

        if (!connected) {
          this._session = null;
        }
      }

      this._sendConnectionResponse(error ? false : connected);
    } catch (e) {
      this._sendConnectionResponse(false, UnknownError);
    }
  }

  private _returnPermissions(): TPermissionsAllowedToSuggest | null {
    try {
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
    } catch (e) {}

    return null;
  }

  private async _sendNewAccountRequest(data: ProxyNewAccountRequest["data"]) {
    let requestWasSent = false;
    try {
      if (this._session) {
        let protocol: TProtocol;

        if (data?.protocol) {
          try {
            protocol = Protocol.parse(data.protocol);
          } catch (e) {
            return this._sendNewAccountResponse(null, InvalidProtocol);
          }
        }

        const message: NewAccountRequestMessage = {
          type: NEW_ACCOUNT_REQUEST,
          data: {
            origin: window.location.origin,
            faviconUrl: this._getFaviconUrl(),
            sessionId: this._session.id,
            protocol,
          },
        };
        const response: ExternalNewAccountResOnProxy =
          await browser.runtime.sendMessage(message);

        requestWasSent = true;
        console.log("RESPONSE:", response);

        if (response?.type === NEW_ACCOUNT_RESPONSE) {
          await this._handleNewAccountResponse(response);
        }
      } else {
        return this._sendNewAccountResponse(null, NotConnected);
      }
    } catch (e) {
      console.log(e);
      if (!requestWasSent) {
        this._sendNewAccountResponse(null, UnknownError);
      }
    }
  }

  private async _handleNewAccountResponse(
    response: NewAccountResponseFromBack
  ) {
    try {
      console.log(response);
      const { error, data } = response;

      if (data) {
        this._sendNewAccountResponse(data);
      } else {
        this._sendNewAccountResponse(null, error);

        if (error.name === "INVALID_SESSION") {
          this._sendDisconnectResponse(true);
        }
      }
    } catch (e) {
      this._sendNewAccountResponse(null, UnknownError);
    }
  }

  private _sendNewAccountResponse(
    data: NewAccountResponseFromBack["data"],
    error: ProxyNewAccountRequestErrors = null
  ) {
    try {
      let response: ProxyNewAccountRes;

      if (error) {
        response = {
          from: "VAULT_KEYRING",
          type: NEW_ACCOUNT_RESPONSE,
          data: null,
          error,
        };
      } else {
        response = {
          from: "VAULT_KEYRING",
          type: NEW_ACCOUNT_RESPONSE,
          data: {
            rejected: typeof data !== null ? data.rejected : true,
            address: typeof data !== null ? data.address : null,
            protocol: typeof data !== null ? data.protocol : null,
          },
          error: null,
        };
      }

      window.postMessage(response);
    } catch (e) {
      window.postMessage({
        from: "VAULT_KEYRING",
        type: NEW_ACCOUNT_RESPONSE,
        data: null,
        error: UnknownError,
      } as ProxyNewAccountRes);
    }
  }

  private async _sendTransferRequest(data: ProxyTransferRequest["data"]) {
    let requestWasSent = false;
    try {
      if (this._session) {
        const { fromAddress, toAddress, amount } = data || {};
        let transferData: TTransferRequestBody;

        if (!fromAddress) {
          return this._sendTransferResponse(null, FromAddressNotPresented);
        }

        if (!toAddress) {
          return this._sendTransferResponse(null, ToAddressNotPresented);
        }

        if (!amount) {
          return this._sendTransferResponse(null, AmountNotPresented);
        }

        try {
          transferData = TransferRequestBody.parse(data);
        } catch (e) {
          const zodError: ZodError = e;
          const path = zodError?.issues?.[0]?.path?.[0];

          switch (path) {
            case "toAddress": {
              return this._sendTransferResponse(null, ToAddressNotValid);
            }
            case "fromAddress": {
              return this._sendTransferResponse(null, FromAddressNotValid);
            }
            case "amount": {
              return this._sendTransferResponse(null, AmountNotValid);
            }
            case "memo": {
              return this._sendTransferResponse(null, MemoNotValid);
            }
            case "protocol": {
              return this._sendTransferResponse(null, InvalidProtocol);
            }
            default: {
              return this._sendTransferResponse(null, InvalidBody);
            }
          }
        }

        const message: TransferRequestMessage = {
          type: TRANSFER_REQUEST,
          data: {
            origin: window.location.origin,
            faviconUrl: this._getFaviconUrl(),
            sessionId: this._session.id,
            ...transferData,
          },
        };

        const response: ExternalTransferResOnProxy =
          await browser.runtime.sendMessage(message);

        requestWasSent = true;
        console.log("RESPONSE:", response);

        if (response?.type === TRANSFER_RESPONSE) {
          await this._handleTransferResponse(response);
        }
      } else {
        return this._sendTransferResponse(null, NotConnected);
      }
    } catch (e) {
      if (!requestWasSent) {
        this._sendTransferResponse(null, UnknownError);
      }
    }
  }

  private async _handleTransferResponse(response: TransferResponseFromBack) {
    try {
      console.log(response);
      const { error, data } = response;

      if (data) {
        this._sendTransferResponse(data);
      } else {
        this._sendTransferResponse(null, error);

        if (error.name === "INVALID_SESSION") {
          this._sendDisconnectResponse(true);
        }
      }
    } catch (e) {
      this._sendTransferResponse(null, UnknownError);
    }
  }

  private _sendTransferResponse(
    data: InternalTransferResponse["data"],
    error: ProxyTransferError = null
  ) {
    try {
      let response: ProxyTransferRes;

      if (error) {
        response = {
          from: "VAULT_KEYRING",
          type: "TRANSFER_RESPONSE",
          data: null,
          error,
        };
      } else {
        response = {
          from: "VAULT_KEYRING",
          type: "TRANSFER_RESPONSE",
          data: {
            rejected: typeof data !== null ? data.rejected : true,
            hash: typeof data !== null ? data.hash : null,
            protocol: typeof data !== null ? data.protocol : null,
          },
          error: null,
        };
      }

      window.postMessage(response);
    } catch (e) {
      window.postMessage({
        from: "VAULT_KEYRING",
        type: "TRANSFER_RESPONSE",
        data: null,
        error,
      } as ProxyTransferRes);
    }
  }

  private async _handleDisconnectRequest() {
    try {
      if (this._session) {
        const message: DisconnectRequestMessage = {
          type: DISCONNECT_REQUEST,
          data: {
            sessionId: this._session.id,
            origin: window.location.origin,
          },
        };
        const response: DisconnectBackResponse =
          await browser.runtime.sendMessage(message);

        console.log("RESPONSE:", response);

        const disconnected =
          response?.data?.disconnected ||
          response?.error?.name === "INVALID_SESSION";

        if (disconnected) {
          this._session = null;
        }

        this._sendDisconnectResponse(
          disconnected,
          !disconnected ? response?.error : null
        );
      } else {
        this._sendDisconnectResponse(false, NotConnected);
      }
    } catch (e) {
      this._sendDisconnectResponse(false, UnknownError);
    }
  }

  private _sendDisconnectResponse(
    disconnect: boolean,
    error: ProxyDisconnectErrors = null
  ) {
    try {
      let response: ProxyDisconnectRes;
      if (disconnect) {
        this._session = null;
        response = {
          from: "VAULT_KEYRING",
          type: DISCONNECT_RESPONSE,
          data: {
            disconnected: true,
          },
          error: null,
        };
      } else {
        response = {
          from: "VAULT_KEYRING",
          type: DISCONNECT_RESPONSE,
          data: null,
          error,
        };
      }

      window.postMessage(response);
    } catch (e) {
      window.postMessage({
        from: "VAULT_KEYRING",
        type: DISCONNECT_RESPONSE,
        data: null,
        error,
      } as ProxyDisconnectRes);
    }
  }

  private async _handleListAccountsRequest() {
    try {
      let proxyResponse: ProxyListAccountsRes;
      if (this._session) {
        const message: ListAccountsRequestMessage = {
          type: LIST_ACCOUNTS_REQUEST,
          data: {
            sessionId: this._session.id,
            origin: window.location.origin,
          },
        };
        const response: ExternalListAccountsResponse =
          await browser.runtime.sendMessage(message);

        if (response?.error) {
          proxyResponse = {
            from: "VAULT_KEYRING",
            type: LIST_ACCOUNTS_RESPONSE,
            error: response?.error,
            data: null,
          };
        } else {
          proxyResponse = {
            from: "VAULT_KEYRING",
            type: LIST_ACCOUNTS_RESPONSE,
            error: null,
            data: {
              accounts: response?.data?.accounts,
            },
          };
        }
      } else {
        proxyResponse = {
          from: "VAULT_KEYRING",
          type: LIST_ACCOUNTS_RESPONSE,
          error: NotConnected,
          data: null,
        };
      }
      window.postMessage(proxyResponse);

      if (proxyResponse?.error?.name === "INVALID_SESSION") {
        this._sendDisconnectResponse(true);
      }
    } catch (e) {
      window.postMessage({
        from: "VAULT_KEYRING",
        type: LIST_ACCOUNTS_RESPONSE,
        error: UnknownError,
        data: null,
      } as ProxyListAccountsRes);
    }
  }
}

export default ProxyCommunicationController;
