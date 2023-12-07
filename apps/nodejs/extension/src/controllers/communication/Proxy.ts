import { SupportedProtocols } from "@poktscan/keyring";
import type { BrowserRequest } from "../../types";
import type {
  AppIsReadyRequest,
  ConnectionRequestMessage,
  ConnectionResponseFromBack,
  DisconnectBackResponse,
  DisconnectRequestMessage,
  ExternalConnectionResOnProxy,
  ExternalListAccountsResponse,
  ExternalNewAccountResOnProxy,
  ExternalTransferResOnProxy,
  InternalTransferResponse,
  IsSessionValidResponse,
  ListAccountsRequestMessage,
  NewAccountRequestMessage,
  NewAccountResponseFromBack,
  ProxyConnectionErrors,
  ProxyConnectionRes,
  ProxyDisconnectErrors,
  ProxyDisconnectRes,
  ProxyListAccountsRes,
  ProxyNewAccountRequest,
  ProxyNewAccountRequestErrors,
  ProxyNewAccountRes,
  ProxySwitchChainRes,
  ProxyTransferError,
  ProxyTransferRequest,
  ProxyTransferRes,
  SessionValidRequestMessage,
  SwitchChainRequestMessage,
  TransferRequestMessage,
  TransferResponseFromBack,
} from "../../types/communication";
import {
  AccountsChangedToProvider,
  AccountsChangedToProxy,
  AppIsReadyResponse,
  BalanceRequestMessage,
  ExternalBalanceResponse,
  ExternalGetPoktTxResponse,
  ExternalSelectedChainResponse,
  ExternalSwitchChainResOnProxy,
  GetPoktTxRequestMessage,
  PartialSession,
  ProxyBalanceRes,
  ProxyGetPoktTxRes,
  ProxySelectedChainRes,
  SelectedChainRequestMessage,
  SwitchChainResponseFromBack,
} from "../../types/communication";
import browser from "webextension-polyfill";
import { z, ZodError } from "zod";
import {
  APP_IS_NOT_READY,
  APP_IS_READY,
  APP_IS_READY_REQUEST,
  CONNECTION_REQUEST_MESSAGE,
  CONNECTION_RESPONSE_MESSAGE,
  DISCONNECT_REQUEST,
  DISCONNECT_RESPONSE,
  EXTERNAL_ACCOUNT_BALANCE_REQUEST,
  EXTERNAL_ACCOUNT_BALANCE_RESPONSE,
  GET_POKT_TRANSACTION_REQUEST,
  GET_POKT_TRANSACTION_RESPONSE,
  IS_SESSION_VALID_REQUEST,
  IS_SESSION_VALID_RESPONSE,
  LIST_ACCOUNTS_REQUEST,
  LIST_ACCOUNTS_RESPONSE,
  NEW_ACCOUNT_REQUEST,
  NEW_ACCOUNT_RESPONSE,
  SELECTED_ACCOUNT_CHANGED,
  SELECTED_CHAIN_CHANGED,
  SELECTED_CHAIN_REQUEST,
  SELECTED_CHAIN_RESPONSE,
  SWITCH_CHAIN_REQUEST,
  SWITCH_CHAIN_RESPONSE,
  TRANSFER_REQUEST,
  TRANSFER_RESPONSE,
} from "../../constants/communication";
import {
  AddressNotValid,
  AmountNotPresented,
  BlockNotSupported,
  ChainIdNotPresented,
  FromAddressNotPresented,
  UnauthorizedError,
  OperationRejected,
  propertyIsNotValid,
  ToAddressNotPresented,
  UnknownError,
} from "../../errors/communication";
import { isValidAddress } from "../../utils/networkOperations";
import { AppIsReadyMessage } from "../providers/base";

interface DisconnectResponse {
  type: typeof DISCONNECT_RESPONSE;
  data: {
    disconnected: true;
    protocol: SupportedProtocols;
  };
  error: null;
}

interface ChainChangedMessage {
  type: typeof SELECTED_CHAIN_CHANGED;
  network: SupportedProtocols;
  data: {
    chainId: string;
  };
}

type ExtensionResponses =
  | AppIsReadyResponse
  | ConnectionResponseFromBack
  | NewAccountResponseFromBack
  | TransferResponseFromBack
  | DisconnectResponse
  | ChainChangedMessage
  | AccountsChangedToProxy
  | SwitchChainResponseFromBack;

export type TPocketTransferBody = z.infer<typeof PocketTransferBody>;

const PocketTransferBody = z.object({
  from: z
    .string()
    .length(40)
    .refine(
      (value) => isValidAddress(value, SupportedProtocols.Pocket),
      "from is not a valid address"
    ),
  to: z
    .string()
    .length(40)
    .refine(
      (value) => isValidAddress(value, SupportedProtocols.Pocket),
      "from is not a valid address"
    ),
  amount: z
    .string()
    .nonempty()
    .regex(/^\d+$/)
    .refine((value) => Number(value) > 0, "amount should be greater than 0"),
  memo: z.string().max(75).optional(),
});

const numberRegex = /^0x([1-9a-f]+[0-9a-f]*|0)$/;
const stringRegex = /^0x[0-9a-f]*$/;

export type TEthTransferBody = z.infer<typeof EthTransferBody>;

const EthTransferBody = z.object({
  from: z
    .string()
    .refine(
      (value) => isValidAddress(value, SupportedProtocols.Ethereum),
      "from is not a valid address"
    ),
  to: z
    .string()
    .refine(
      (value) => isValidAddress(value, SupportedProtocols.Ethereum),
      "from is not a valid address"
    ),
  gas: z.string().regex(numberRegex).optional(),
  value: z.string().regex(numberRegex).optional(),
  data: z.string().regex(stringRegex).optional(),
  maxPriorityFeePerGas: z.string().regex(numberRegex).optional(),
  maxFeePerGas: z.string().regex(numberRegex).optional(),
});

// Controller to manage the communication between the webpages and the content script
class ProxyCommunicationController {
  private _sessionByProtocol: Partial<
    Record<SupportedProtocols, PartialSession>
  > = {};
  private _backgroundIsReady = false;

  constructor() {
    this._checkLastSession();
    this._checkAppIsReady().catch();

    window.addEventListener(
      "message",
      async (event: MessageEvent<BrowserRequest>) => {
        const { data, origin } = event;

        if (
          origin === window.location.origin &&
          data?.to === "VAULT_KEYRING" &&
          Object.values(SupportedProtocols).includes(data?.network)
        ) {
          if (!this._backgroundIsReady) {
            return window.postMessage({
              to: "VAULT_KEYRING",
              type: APP_IS_NOT_READY,
              network: data.network,
              id: data.id,
            });
          }

          if (data?.type === CONNECTION_REQUEST_MESSAGE) {
            await this._sendConnectionRequest(data.network, data.id);
          }

          if (data?.type === NEW_ACCOUNT_REQUEST) {
            await this._sendNewAccountRequest(data.network, data.id, data.data);
          }

          if (data?.type === TRANSFER_REQUEST) {
            await this._sendTransferRequest(data.network, data.id, data.data);
          }

          // if (data?.type === DISCONNECT_REQUEST) {
          //   await this._handleDisconnectRequest(data.network);
          // }

          if (data?.type === LIST_ACCOUNTS_REQUEST) {
            await this._handleListAccountsRequest(data.network, data.id);
          }

          if (data?.type === EXTERNAL_ACCOUNT_BALANCE_REQUEST) {
            await this._handleBalanceRequest(
              data?.network,
              data.id,
              data?.data?.address,
              data?.data?.block
            );
          }

          if (data?.type === SELECTED_CHAIN_REQUEST) {
            await this._handleGetSelectedChain(data?.network, data.id);
          }

          if (
            data?.type === GET_POKT_TRANSACTION_REQUEST &&
            data.network === SupportedProtocols.Pocket
          ) {
            await this._getPoktTx(data?.data?.hash, data.id);
          }

          if (data?.type === SWITCH_CHAIN_REQUEST) {
            await this._sendSwitchChainRequest(
              data.network,
              data.id,
              data?.data?.chainId
            );
          }
        }
      }
    );

    browser.runtime.onMessage.addListener(
      async (message: ExtensionResponses) => {
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
          this._sendDisconnectResponse(
            message.data?.disconnected,
            message.error,
            message.data?.protocol
          );
        }

        if (message?.type === SWITCH_CHAIN_RESPONSE) {
          this._sendSwitchChainResponse(message?.requestId, message?.error);
        }

        if (message?.type === SELECTED_ACCOUNT_CHANGED) {
          this._sendMessageAccountsChanged({
            protocol: message.network,
            addresses: message.data.addresses,
          });
        }
        if (message?.type === SELECTED_CHAIN_CHANGED) {
          this._sendMessageChainChanged(message);
        }

        return "RECEIVED";
      }
    );
  }

  private async _checkAppIsReady() {
    try {
      if (this._backgroundIsReady) return;

      const response: AppIsReadyResponse = await browser.runtime.sendMessage({
        type: APP_IS_READY_REQUEST,
      } as AppIsReadyRequest);

      if (response.data?.isReady) {
        this._backgroundIsReady = true;
        for (const protocol of Object.values(SupportedProtocols)) {
          setTimeout(() => {
            window.postMessage(
              {
                to: "VAULT_KEYRING",
                type: APP_IS_READY,
                network: protocol,
                data: {
                  chainId: response.data.chainByProtocol[protocol],
                },
              } as AppIsReadyMessage,
              window.location.origin
            );
          }, 1000);
        }
      } else {
        await this._checkAppIsReady();
      }
    } catch (e) {
      await this._checkAppIsReady();
    }
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

  private _sendMessageChainChanged(message: ChainChangedMessage) {
    window.postMessage(
      {
        to: "VAULT_KEYRING",
        type: SELECTED_CHAIN_CHANGED,
        network: message.network,
        data: message.data,
      },
      window.location.origin
    );
  }

  private async _sendConnectionRequest(
    protocol: SupportedProtocols,
    requestId: string
  ) {
    let requestWasSent = false;
    try {
      const session = this._sessionByProtocol[protocol];
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

        if (messageResponse?.data?.isValid) {
          const message: ListAccountsRequestMessage = {
            type: LIST_ACCOUNTS_REQUEST,
            requestId,
            data: {
              sessionId: session?.id,
              origin: window.location.origin,
              protocol,
            },
          };
          const response: ExternalListAccountsResponse =
            await browser.runtime.sendMessage(message);

          if (response?.data?.accounts) {
            return this._sendConnectionResponse(
              response?.requestId,
              response?.data?.accounts
            );
          }
        }
      }

      const message: ConnectionRequestMessage = {
        type: CONNECTION_REQUEST_MESSAGE,
        requestId,
        data: {
          origin: window.location.origin,
          faviconUrl: this._getFaviconUrl(),
          protocol,
        },
      };

      const response: ExternalConnectionResOnProxy =
        await browser.runtime.sendMessage(message);
      requestWasSent = true;

      if (response?.type === CONNECTION_RESPONSE_MESSAGE) {
        await this._handleConnectionResponse(response, requestId);
      }
    } catch (e) {
      if (!requestWasSent) {
        this._sendConnectionResponse(requestId, null, UnknownError);
      }
    }
  }

  private async _handleConnectionResponse(
    extensionResponse: ConnectionResponseFromBack,
    idFromRequest?: string
  ) {
    try {
      const { error, data, requestId } = extensionResponse;

      if (data) {
        const { accepted, session, protocol } = data;

        if (accepted && session) {
          this._sessionByProtocol[protocol] = session;

          await browser.storage.local.set({
            [`${window.location.origin}-session-${protocol}`]: session,
          });

          this._sendConnectionResponse(requestId, data.addresses);
          this._sendMessageAccountsChanged({
            protocol,
            addresses: data.addresses,
          });
        } else {
          this._sendConnectionResponse(requestId, null, OperationRejected);
        }
      } else {
        this._sendConnectionResponse(requestId, null, error);
      }
    } catch (e) {
      this._sendConnectionResponse(idFromRequest, null, UnknownError);
    }
  }

  private _sendConnectionResponse(
    requestId: string,
    addresses: string[] | null,
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
          id: requestId,
        };
      } else {
        response = {
          type: CONNECTION_RESPONSE_MESSAGE,
          from: "VAULT_KEYRING",
          error: null,
          data: addresses,
          id: requestId,
        };
      }

      window.postMessage(response, window.location.origin);
    } catch (e) {
      window.postMessage(
        {
          type: CONNECTION_RESPONSE_MESSAGE,
          from: "VAULT_KEYRING",
          data: null,
          error: UnknownError,
          id: requestId,
        } as ProxyConnectionRes,
        window.location.origin
      );
    }
  }

  private _checkLastSession() {
    try {
      browser.storage.local
        .get({
          [`${window.location.origin}-session-${SupportedProtocols.Pocket}`]:
            null,
          [`${window.location.origin}-session-${SupportedProtocols.Ethereum}`]:
            null,
        })
        .then(async (response) => {
          const checkSession = async (protocol: SupportedProtocols) => {
            const session =
              response[`${window.location.origin}-session-${protocol}`];
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
                  this._sessionByProtocol[protocol] = session;
                } else {
                  if (typeof isValid === "boolean") {
                    await browser.storage.local.remove(
                      `${window.location.origin}-session-${protocol}`
                    );
                  }
                }
              }
            }
          };

          await Promise.allSettled([
            checkSession(SupportedProtocols.Ethereum),
            checkSession(SupportedProtocols.Pocket),
          ]);
        });
    } catch (e) {}
  }

  private async _sendNewAccountRequest(
    protocol: SupportedProtocols,
    requestId: string,
    data: ProxyNewAccountRequest["data"]
  ) {
    let requestWasSent = false;
    try {
      const session = this._sessionByProtocol[protocol];
      if (session) {
        const message: NewAccountRequestMessage = {
          type: NEW_ACCOUNT_REQUEST,
          requestId,
          data: {
            origin: window.location.origin,
            faviconUrl: this._getFaviconUrl(),
            sessionId: session.id,
            protocol: data.protocol,
          },
        };
        const response: ExternalNewAccountResOnProxy =
          await browser.runtime.sendMessage(message);

        requestWasSent = true;

        if (response?.type === NEW_ACCOUNT_RESPONSE) {
          await this._handleNewAccountResponse(response);
        }
      } else {
        return this._sendNewAccountResponse(requestId, null, UnauthorizedError);
      }
    } catch (e) {
      if (!requestWasSent) {
        this._sendNewAccountResponse(requestId, null, UnknownError);
      }
    }
  }

  private async _handleNewAccountResponse(
    response: NewAccountResponseFromBack,
    idFromRequest?: string
  ) {
    try {
      const { error, data, requestId } = response;

      if (data) {
        if (data.rejected) {
          this._sendNewAccountResponse(requestId, null, OperationRejected);
        } else {
          this._sendNewAccountResponse(requestId, data);
        }
      } else {
        this._sendNewAccountResponse(requestId, null, error);

        if (error?.code === UnauthorizedError.code) {
          this._sendDisconnectResponse(true, null, response.data.protocol);
        }
      }
    } catch (e) {
      this._sendNewAccountResponse(idFromRequest, null, UnknownError);
    }
  }

  private _sendNewAccountResponse(
    requestId: string,
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
          id: requestId,
        };
      } else {
        response = {
          from: "VAULT_KEYRING",
          id: requestId,
          type: NEW_ACCOUNT_RESPONSE,
          data: {
            rejected: typeof data !== null ? data.rejected : true,
            address: typeof data !== null ? data.address : null,
            protocol: typeof data !== null ? data.protocol : null,
          },
          error: null,
        };
      }

      window.postMessage(response, window.location.origin);
    } catch (e) {
      window.postMessage(
        {
          from: "VAULT_KEYRING",
          type: NEW_ACCOUNT_RESPONSE,
          data: null,
          error: UnknownError,
          id: requestId,
        } as ProxyNewAccountRes,
        window.location.origin
      );
    }
  }

  private async _sendTransferRequest(
    protocol: SupportedProtocols,
    requestId: string,
    data: ProxyTransferRequest["data"]
  ) {
    let requestWasSent = false;
    try {
      const session = this._sessionByProtocol[protocol];
      if (session) {
        let transferData: TPocketTransferBody | TEthTransferBody;

        if (!data?.from) {
          return this._sendTransferResponse(
            requestId,
            null,
            FromAddressNotPresented
          );
        }

        if (!data?.to) {
          return this._sendTransferResponse(
            requestId,
            null,
            ToAddressNotPresented
          );
        }

        if (protocol === SupportedProtocols.Pocket) {
          if (!(data as TPocketTransferBody)?.amount) {
            return this._sendTransferResponse(
              requestId,
              null,
              AmountNotPresented
            );
          }
        }

        try {
          if (protocol === SupportedProtocols.Pocket) {
            transferData = PocketTransferBody.parse(data);
          } else {
            transferData = EthTransferBody.parse(data);
          }
        } catch (e) {
          const zodError: ZodError = e;
          const path = zodError?.issues?.[0]?.path?.[0];

          const errorToReturn = propertyIsNotValid(path as string);
          return this._sendTransferResponse(requestId, null, errorToReturn);
        }

        const message: TransferRequestMessage = {
          type: TRANSFER_REQUEST,
          requestId,
          data: {
            origin: window.location.origin,
            faviconUrl: this._getFaviconUrl(),
            sessionId: session.id,
            protocol,
            transferData,
          },
        };

        const response: ExternalTransferResOnProxy =
          await browser.runtime.sendMessage(message);

        requestWasSent = true;

        if (response?.type === TRANSFER_RESPONSE) {
          await this._handleTransferResponse(response, requestId);
        }
      } else {
        return this._sendTransferResponse(requestId, null, UnauthorizedError);
      }
    } catch (e) {
      if (!requestWasSent) {
        this._sendTransferResponse(requestId, null, UnknownError);
      }
    }
  }

  private async _handleTransferResponse(
    response: TransferResponseFromBack,
    idOfRequest?: string
  ) {
    try {
      const { error, data, requestId } = response;

      if (data) {
        if (data.rejected) {
          this._sendTransferResponse(requestId, null, OperationRejected);
        } else {
          this._sendTransferResponse(requestId, data);
        }
      } else {
        this._sendTransferResponse(requestId, null, error);

        if (error?.code === UnauthorizedError.code) {
          this._sendDisconnectResponse(true, null, response.data.protocol);
        }
      }
    } catch (e) {
      this._sendTransferResponse(idOfRequest, null, UnknownError);
    }
  }

  private _sendTransferResponse(
    requestId: string,
    data: InternalTransferResponse["data"],
    error: ProxyTransferError = null
  ) {
    try {
      let response: ProxyTransferRes;

      if (error) {
        response = {
          id: requestId,
          from: "VAULT_KEYRING",
          type: "TRANSFER_RESPONSE",
          data: null,
          error,
        };
      } else {
        response = {
          id: requestId,
          from: "VAULT_KEYRING",
          type: "TRANSFER_RESPONSE",
          data: data.hash,
          error: null,
        };
      }

      window.postMessage(response, window.location.origin);
    } catch (e) {
      window.postMessage(
        {
          id: requestId,
          from: "VAULT_KEYRING",
          type: "TRANSFER_RESPONSE",
          data: null,
          error: UnknownError,
        } as ProxyTransferRes,
        window.location.origin
      );
    }
  }

  private async _handleDisconnectRequest(protocol: SupportedProtocols) {
    try {
      const session = this._sessionByProtocol[protocol];
      if (session) {
        const message: DisconnectRequestMessage = {
          type: DISCONNECT_REQUEST,
          data: {
            sessionId: session.id,
            origin: window.location.origin,
          },
        };
        const response: DisconnectBackResponse =
          await browser.runtime.sendMessage(message);

        const disconnected =
          response?.data?.disconnected ||
          response?.error?.code === UnauthorizedError.code;

        if (disconnected) {
          this._sessionByProtocol[protocol] = null;
        }

        this._sendDisconnectResponse(
          disconnected,
          !disconnected ? response?.error : null,
          protocol
        );
      } else {
        this._sendDisconnectResponse(false, UnauthorizedError, protocol);
      }
    } catch (e) {
      this._sendDisconnectResponse(false, UnknownError, protocol);
    }
  }

  private _sendDisconnectResponse(
    disconnect: boolean,
    error: ProxyDisconnectErrors = null,
    protocol: SupportedProtocols
  ) {
    try {
      let response: ProxyDisconnectRes;
      if (disconnect) {
        this._sessionByProtocol[protocol] = null;
        response = {
          id: "",
          from: "VAULT_KEYRING",
          type: DISCONNECT_RESPONSE,
          data: {
            disconnected: true,
          },
          error: null,
        };
        this._sendMessageAccountsChanged({
          protocol,
          addresses: [],
        });
      } else {
        response = {
          id: "",
          from: "VAULT_KEYRING",
          type: DISCONNECT_RESPONSE,
          data: null,
          error,
        };
      }

      window.postMessage(response, window.location.origin);
    } catch (e) {
      window.postMessage(
        {
          id: "",
          from: "VAULT_KEYRING",
          type: DISCONNECT_RESPONSE,
          data: null,
          error: UnknownError,
        } as ProxyDisconnectRes,
        window.location.origin
      );
    }
  }

  private async _handleListAccountsRequest(
    protocol: SupportedProtocols,
    requestId: string
  ) {
    try {
      let proxyResponse: ProxyListAccountsRes;

      const session = this._sessionByProtocol[protocol];

      const message: ListAccountsRequestMessage = {
        type: LIST_ACCOUNTS_REQUEST,
        requestId,
        data: {
          sessionId: session?.id,
          origin: window.location.origin,
          protocol,
        },
      };
      const response: ExternalListAccountsResponse =
        await browser.runtime.sendMessage(message);

      if (response?.error) {
        proxyResponse = {
          id: response.requestId || requestId,
          from: "VAULT_KEYRING",
          type: LIST_ACCOUNTS_RESPONSE,
          error: response?.error,
          data: null,
        };
      } else {
        proxyResponse = {
          id: response.requestId || requestId,
          from: "VAULT_KEYRING",
          type: LIST_ACCOUNTS_RESPONSE,
          error: null,
          data: response?.data?.accounts,
        };
      }

      window.postMessage(proxyResponse, window.location.origin);

      if (proxyResponse?.error?.code === UnauthorizedError.code) {
        this._sendDisconnectResponse(true, null, protocol);
      }
    } catch (e) {
      window.postMessage(
        {
          id: requestId,
          from: "VAULT_KEYRING",
          type: LIST_ACCOUNTS_RESPONSE,
          error: UnknownError,
          data: null,
        } as ProxyListAccountsRes,
        window.location.origin
      );
    }
  }

  private async _handleBalanceRequest(
    protocol: SupportedProtocols,
    requestId: string,
    address: string,
    block?: string
  ) {
    try {
      if (!address || !isValidAddress(address, protocol)) {
        return window.postMessage(
          {
            from: "VAULT_KEYRING",
            type: EXTERNAL_ACCOUNT_BALANCE_RESPONSE,
            data: null,
            error: AddressNotValid,
            id: requestId,
          } as ProxyBalanceRes,
          window.location.origin
        );
      }

      if (
        block &&
        protocol === SupportedProtocols.Ethereum &&
        block !== "latest"
      ) {
        return window.postMessage(
          {
            from: "VAULT_KEYRING",
            type: EXTERNAL_ACCOUNT_BALANCE_RESPONSE,
            data: null,
            error: BlockNotSupported,
            id: requestId,
          } as ProxyBalanceRes,
          window.location.origin
        );
      }

      const message: BalanceRequestMessage = {
        type: EXTERNAL_ACCOUNT_BALANCE_REQUEST,
        requestId,
        data: {
          origin: window.location.origin,
          protocol,
          address,
        },
      };
      const response: ExternalBalanceResponse =
        await browser.runtime.sendMessage(message);

      let proxyResponse: ProxyBalanceRes;

      if (response?.error) {
        proxyResponse = {
          id: response.requestId || requestId,
          from: "VAULT_KEYRING",
          type: EXTERNAL_ACCOUNT_BALANCE_RESPONSE,
          error: response?.error,
          data: null,
        };
      } else {
        proxyResponse = {
          id: response.requestId || requestId,
          from: "VAULT_KEYRING",
          type: EXTERNAL_ACCOUNT_BALANCE_RESPONSE,
          error: null,
          data: response?.data?.balance,
        };
      }

      window.postMessage(proxyResponse, window.location.origin);
    } catch (e) {
      window.postMessage(
        {
          from: "VAULT_KEYRING",
          type: EXTERNAL_ACCOUNT_BALANCE_RESPONSE,
          data: null,
          error: UnknownError,
          id: requestId,
        } as ProxyBalanceRes,
        window.location.origin
      );
    }
  }

  private async _handleGetSelectedChain(
    protocol: SupportedProtocols,
    requestId: string
  ) {
    try {
      const message: SelectedChainRequestMessage = {
        type: SELECTED_CHAIN_REQUEST,
        requestId,
        data: {
          origin: window.location.origin,
          protocol,
        },
      };
      const response: ExternalSelectedChainResponse =
        await browser.runtime.sendMessage(message);

      let proxyResponse: ProxySelectedChainRes;

      if (response?.error) {
        proxyResponse = {
          id: response.requestId || requestId,
          from: "VAULT_KEYRING",
          type: SELECTED_CHAIN_RESPONSE,
          error: response?.error,
          data: null,
        };
      } else {
        proxyResponse = {
          id: response.requestId || requestId,
          from: "VAULT_KEYRING",
          type: SELECTED_CHAIN_RESPONSE,
          error: null,
          data: response?.data?.chainId,
        };
      }

      window.postMessage(proxyResponse, window.location.origin);
    } catch (e) {
      window.postMessage(
        {
          id: requestId,
          from: "VAULT_KEYRING",
          type: SELECTED_CHAIN_RESPONSE,
          data: null,
          error: UnknownError,
        } as ProxySelectedChainRes,
        window.location.origin
      );
    }
  }

  private async _getPoktTx(hash: string, requestId: string) {
    try {
      const message: GetPoktTxRequestMessage = {
        type: GET_POKT_TRANSACTION_REQUEST,
        requestId,
        data: {
          origin: window.location.origin,
          hash,
        },
      };
      const response: ExternalGetPoktTxResponse =
        await browser.runtime.sendMessage(message);

      let proxyResponse: ProxyGetPoktTxRes;

      if (response?.error) {
        proxyResponse = {
          id: response.requestId || requestId,
          from: "VAULT_KEYRING",
          type: GET_POKT_TRANSACTION_RESPONSE,
          error: response?.error,
          data: null,
        };
      } else {
        proxyResponse = {
          id: response.requestId || requestId,
          from: "VAULT_KEYRING",
          type: GET_POKT_TRANSACTION_RESPONSE,
          error: null,
          data: response?.data,
        };
      }

      window.postMessage(proxyResponse, window.location.origin);
    } catch (e) {
      window.postMessage(
        {
          id: requestId,
          from: "VAULT_KEYRING",
          type: GET_POKT_TRANSACTION_RESPONSE,
          data: null,
          error: UnknownError,
        } as ProxyGetPoktTxRes,
        window.location.origin
      );
    }
  }

  private async _sendSwitchChainRequest(
    protocol: SupportedProtocols,
    requestId: string,
    chainId: string
  ) {
    try {
      if (!chainId) {
        return this._sendSwitchChainResponse(requestId, ChainIdNotPresented);
      }
      const message: SwitchChainRequestMessage = {
        type: SWITCH_CHAIN_REQUEST,
        requestId,
        data: {
          origin: window.location.origin,
          protocol,
          chainId,
          faviconUrl: this._getFaviconUrl(),
        },
      };

      const response: ExternalSwitchChainResOnProxy =
        await browser.runtime.sendMessage(message);

      if (response?.type === SWITCH_CHAIN_RESPONSE) {
        this._sendSwitchChainResponse(
          response.requestId || requestId,
          response.error
        );
      }
    } catch (e) {
      window.postMessage(
        {
          id: requestId,
          from: "VAULT_KEYRING",
          type: SWITCH_CHAIN_RESPONSE,
          data: null,
          error: UnknownError,
        } as ProxySwitchChainRes,
        window.location.origin
      );
    }
  }

  private _sendSwitchChainResponse(requestId: string, error?) {
    try {
      let response: ProxySwitchChainRes;

      if (error) {
        response = {
          id: requestId,
          type: SWITCH_CHAIN_RESPONSE,
          from: "VAULT_KEYRING",
          data: null,
          error,
        };
      } else {
        response = {
          id: requestId,
          type: SWITCH_CHAIN_RESPONSE,
          from: "VAULT_KEYRING",
          error: null,
          data: null,
        };
      }

      window.postMessage(response, window.location.origin);
    } catch (e) {
      window.postMessage(
        {
          id: requestId,
          type: SWITCH_CHAIN_RESPONSE,
          from: "VAULT_KEYRING",
          data: null,
          error: UnknownError,
        } as ProxySwitchChainRes,
        window.location.origin
      );
    }
  }

  private _sendMessageAccountsChanged(param: {
    protocol: SupportedProtocols;
    addresses: string[];
  }) {
    const message: AccountsChangedToProvider = {
      to: "VAULT_KEYRING",
      type: SELECTED_ACCOUNT_CHANGED,
      network: param.protocol,
      data: {
        addresses: param.addresses,
      },
    };
    window.postMessage(message, window.location.origin);
  }
}

export default ProxyCommunicationController;
