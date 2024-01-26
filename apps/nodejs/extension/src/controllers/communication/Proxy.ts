import type {
  InternalResponses,
  ProxyRequests,
} from "../../types/communications";
import type {
  ExternalConnectionReq,
  ExternalConnectionResToProxy,
  InternalConnectionRes,
  PartialSession,
  ProxyConnectionErrors,
  ProxyConnectionRes,
} from "../../types/communications/connection";
import type {
  ExternalTransferReq,
  ExternalTransferResToProxy,
  ProxyTransferError,
  ProxyTransferReq,
  ProxyTransferRes,
  TransferResponseFromBack,
} from "../../types/communications/transfer";
import type {
  AppIsReadyMessageToProvider,
  BackgroundAppIsReadyReq,
  BackgroundAppIsReadyRes,
} from "../../types/communications/appIsReady";
import type {
  ChainChangedMessageToProxy,
  ChainChangedToProvider,
} from "../../types/communications/chainChanged";
import type {
  ExternalIsSessionValidReq,
  ExternalIsSessionValidRes,
} from "../../types/communications/sessionIsValid";
import type {
  ExternalListAccountsReq,
  ExternalListAccountsRes,
  ProxyListAccountsRes,
} from "../../types/communications/listAccounts";
import type {
  ExternalBalanceReq,
  ExternalBalanceRes,
  ProxyBalanceRes,
} from "../../types/communications/balance";
import type {
  ExternalSelectedChainReq,
  ExternalSelectedChainRes,
  ProxySelectedChainRes,
} from "../../types/communications/selectedChain";
import type {
  ExternalGetPoktTxReq,
  ExternalGetPoktTxRes,
  ProxyGetPoktTxRes,
} from "../../types/communications/getPoktTransaction";
import type {
  ExternalSwitchChainReq,
  ExternalSwitchChainResToProxy,
  ProxySwitchChainRes,
} from "../../types/communications/switchChain";
import type {
  ExternalSignTypedDataReq,
  ExternalSignTypedDataResToProxy,
  InternalSignedTypedDataRes,
  ProxySignedTypedDataErrors,
  ProxySignedTypedDataRes,
  ProxySignTypedDataReq,
} from "../../types/communications/signTypedData";
import type {
  ExternalPersonalSignReq,
  ExternalPersonalSignResToProxy,
  InternalPersonalSignRes,
  ProxyPersonalSignReq,
  ProxyPersonalSignRes,
} from "../../types/communications/personalSign";
import type { AccountsChangedToProvider } from "../../types/communications/accountChanged";
import browser from "webextension-polyfill";
import { z, ZodError } from "zod";
import { SupportedProtocols } from "@poktscan/keyring";
import {
  APP_IS_NOT_READY,
  APP_IS_READY,
  APP_IS_READY_REQUEST,
  CONNECTION_REQUEST_MESSAGE,
  CONNECTION_RESPONSE_MESSAGE,
  DISCONNECT_RESPONSE,
  EXTERNAL_ACCOUNT_BALANCE_REQUEST,
  EXTERNAL_ACCOUNT_BALANCE_RESPONSE,
  GET_POKT_TRANSACTION_REQUEST,
  GET_POKT_TRANSACTION_RESPONSE,
  IS_SESSION_VALID_REQUEST,
  IS_SESSION_VALID_RESPONSE,
  LIST_ACCOUNTS_REQUEST,
  LIST_ACCOUNTS_RESPONSE,
  PERSONAL_SIGN_REQUEST,
  PERSONAL_SIGN_RESPONSE,
  SELECTED_ACCOUNT_CHANGED,
  SELECTED_CHAIN_CHANGED,
  SELECTED_CHAIN_REQUEST,
  SELECTED_CHAIN_RESPONSE,
  SIGN_TYPED_DATA_REQUEST,
  SIGN_TYPED_DATA_RESPONSE,
  SWITCH_CHAIN_REQUEST,
  SWITCH_CHAIN_RESPONSE,
  TRANSFER_REQUEST,
  TRANSFER_RESPONSE,
} from "../../constants/communication";
import {
  BlockNotSupported,
  OperationRejected,
  propertyIsNotValid,
  propertyIsRequired,
  UnauthorizedError,
  UnknownError,
} from "../../errors/communication";
import {
  isValidAddress,
  validateTypedDataPayload,
} from "../../utils/networkOperations";

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
      async (event: MessageEvent<ProxyRequests>) => {
        const { data, origin } = event;

        if (
          origin === window.location.origin &&
          data?.to === "VAULT_KEYRING" &&
          Object.values(SupportedProtocols).includes(data.protocol)
        ) {
          if (!this._backgroundIsReady) {
            return window.postMessage({
              to: "VAULT_KEYRING",
              type: APP_IS_NOT_READY,
              protocol: data.protocol,
              id: data.id,
            });
          }

          if (data.type === CONNECTION_REQUEST_MESSAGE) {
            await this._sendConnectionRequest(data.protocol, data.id);
          }

          if (data.type === TRANSFER_REQUEST) {
            await this._sendTransferRequest(data.protocol, data.id, data.data);
          }

          if (data.type === LIST_ACCOUNTS_REQUEST) {
            await this._handleListAccountsRequest(data.protocol, data.id);
          }

          if (data.type === EXTERNAL_ACCOUNT_BALANCE_REQUEST) {
            await this._handleBalanceRequest(
              data.protocol,
              data.id,
              data.data?.address,
              data.data?.block
            );
          }

          if (data.type === SELECTED_CHAIN_REQUEST) {
            await this._handleGetSelectedChain(data.protocol, data.id);
          }

          if (
            data.type === GET_POKT_TRANSACTION_REQUEST &&
            data.protocol === SupportedProtocols.Pocket
          ) {
            await this._getPoktTx(data.data?.hash, data.id);
          }

          if (data.type === SWITCH_CHAIN_REQUEST) {
            await this._sendSwitchChainRequest(
              data.protocol,
              data.id,
              data.data?.chainId
            );
          }

          if (data.type === SIGN_TYPED_DATA_REQUEST) {
            await this._sendSignTypedDataRequest(
              data.protocol,
              data.id,
              data.data
            );
          }

          if (data.type === PERSONAL_SIGN_REQUEST) {
            await this._sendPersonalSignRequest(
              data.protocol,
              data.id,
              data.data
            );
          }
        }
      }
    );

    browser.runtime.onMessage.addListener(
      async (message: InternalResponses) => {
        if (!message?.type) {
          return;
        }

        if (message.type === CONNECTION_RESPONSE_MESSAGE) {
          await this._handleConnectionResponse(message);
        }

        if (message.type === TRANSFER_RESPONSE) {
          await this._handleTransferResponse(message);
        }

        if (message.type === DISCONNECT_RESPONSE) {
          this._handleDisconnect(message.data?.protocol);
        }

        if (message.type === SWITCH_CHAIN_RESPONSE) {
          this._sendSwitchChainResponse(message.requestId, message.error);
        }

        if (message.type === SIGN_TYPED_DATA_RESPONSE) {
          this._handleSignTypedDataResponse(message);
        }

        if (message.type === PERSONAL_SIGN_RESPONSE) {
          this._handlePersonalSignResponse(message);
        }

        if (message.type === SELECTED_ACCOUNT_CHANGED) {
          this._sendMessageAccountsChanged({
            protocol: message.protocol,
            addresses: message.data.addresses,
          });
        }
        if (message.type === SELECTED_CHAIN_CHANGED) {
          this._sendMessageChainChanged(message);
        }
      }
    );
  }

  private async _checkAppIsReady() {
    try {
      if (this._backgroundIsReady) return;

      const message: BackgroundAppIsReadyReq = {
        type: APP_IS_READY_REQUEST,
      };
      const response: BackgroundAppIsReadyRes =
        await browser.runtime.sendMessage(message);

      if (response?.data?.isReady) {
        this._backgroundIsReady = true;
        for (const protocol of Object.values(SupportedProtocols)) {
          setTimeout(() => {
            const message: AppIsReadyMessageToProvider = {
              from: "VAULT_KEYRING",
              type: APP_IS_READY,
              protocol: protocol,
              data: {
                chainId: response.data.chainByProtocol[protocol],
              },
            };
            window.postMessage(message, window.location.origin);
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

  private _sendMessageChainChanged(message: ChainChangedMessageToProxy) {
    const messageToProvider: ChainChangedToProvider = {
      from: "VAULT_KEYRING",
      type: SELECTED_CHAIN_CHANGED,
      protocol: message.protocol,
      data: message.data,
    };
    window.postMessage(messageToProvider, window.location.origin);
  }

  private async _sendConnectionRequest(
    protocol: SupportedProtocols,
    requestId: string
  ) {
    let requestWasSent = false;
    try {
      const session = this._sessionByProtocol[protocol];
      if (session) {
        const message: ExternalIsSessionValidReq = {
          type: IS_SESSION_VALID_REQUEST,
          data: {
            sessionId: session.id,
            origin: window.location.origin,
          },
        };

        const messageResponse: ExternalIsSessionValidRes =
          await browser.runtime.sendMessage(message);

        if (messageResponse?.data?.isValid) {
          const message: ExternalListAccountsReq = {
            type: LIST_ACCOUNTS_REQUEST,
            requestId,
            data: {
              sessionId: session?.id,
              origin: window.location.origin,
              protocol,
            },
          };
          const response: ExternalListAccountsRes =
            await browser.runtime.sendMessage(message);

          if (response?.data?.accounts) {
            return this._sendConnectionResponse(
              response?.requestId,
              response?.data?.accounts
            );
          }
        }
      }

      const message: ExternalConnectionReq = {
        type: CONNECTION_REQUEST_MESSAGE,
        requestId,
        data: {
          origin: window.location.origin,
          faviconUrl: this._getFaviconUrl(),
          protocol,
        },
      };

      const response: ExternalConnectionResToProxy =
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
    extensionResponse: InternalConnectionRes,
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
              const message: ExternalIsSessionValidReq = {
                type: IS_SESSION_VALID_REQUEST,
                data: {
                  sessionId: session.id,
                  origin: window.location.origin,
                },
              };

              const messageResponse: ExternalIsSessionValidRes =
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

  private async _sendTransferRequest(
    protocol: SupportedProtocols,
    requestId: string,
    data: ProxyTransferReq["data"]
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
            propertyIsNotValid("from")
          );
        }

        if (!data?.to) {
          return this._sendTransferResponse(
            requestId,
            null,
            propertyIsNotValid("to")
          );
        }

        if (protocol === SupportedProtocols.Pocket) {
          if (!(data as TPocketTransferBody)?.amount) {
            return this._sendTransferResponse(
              requestId,
              null,
              propertyIsNotValid("amount")
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

        const message: ExternalTransferReq = {
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

        const response: ExternalTransferResToProxy =
          await browser.runtime.sendMessage(message);

        requestWasSent = true;

        if (response?.type === TRANSFER_RESPONSE) {
          await this._handleTransferResponse(response);
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

  private async _handleTransferResponse(response: TransferResponseFromBack) {
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

        if (error?.isSessionInvalid) {
          this._handleDisconnect(response.data.protocol);
        }
      }
    } catch (e) {
      this._sendTransferResponse(response?.requestId, null, UnknownError);
    }
  }

  private _sendTransferResponse(
    requestId: string,
    data: TransferResponseFromBack["data"],
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

  private _handleDisconnect(protocol: SupportedProtocols) {
    try {
      this._sessionByProtocol[protocol] = null;
      this._sendMessageAccountsChanged({
        protocol,
        addresses: [],
      });
    } catch (e) {}
  }

  private async _handleListAccountsRequest(
    protocol: SupportedProtocols,
    requestId: string
  ) {
    try {
      let proxyResponse: ProxyListAccountsRes;

      const session = this._sessionByProtocol[protocol];

      const message: ExternalListAccountsReq = {
        type: LIST_ACCOUNTS_REQUEST,
        requestId,
        data: {
          sessionId: session?.id,
          origin: window.location.origin,
          protocol,
        },
      };
      const response: ExternalListAccountsRes =
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
    } catch (e) {
      const message: ProxyListAccountsRes = {
        id: requestId,
        from: "VAULT_KEYRING",
        type: LIST_ACCOUNTS_RESPONSE,
        error: UnknownError,
        data: null,
      };
      window.postMessage(message, window.location.origin);
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
        const message: ProxyBalanceRes = {
          from: "VAULT_KEYRING",
          type: EXTERNAL_ACCOUNT_BALANCE_RESPONSE,
          data: null,
          error: propertyIsNotValid("address"),
          id: requestId,
        };
        return window.postMessage(message, window.location.origin);
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

      const message: ExternalBalanceReq = {
        type: EXTERNAL_ACCOUNT_BALANCE_REQUEST,
        requestId,
        data: {
          origin: window.location.origin,
          protocol,
          address,
        },
      };
      const response: ExternalBalanceRes = await browser.runtime.sendMessage(
        message
      );

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
    let proxyResponse: ProxySelectedChainRes;

    try {
      const message: ExternalSelectedChainReq = {
        type: SELECTED_CHAIN_REQUEST,
        requestId,
        data: {
          origin: window.location.origin,
          protocol,
        },
      };
      const response: ExternalSelectedChainRes =
        await browser.runtime.sendMessage(message);

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
      proxyResponse = {
        id: requestId,
        from: "VAULT_KEYRING",
        type: SELECTED_CHAIN_RESPONSE,
        data: null,
        error: UnknownError,
      };
      window.postMessage(proxyResponse, window.location.origin);
    }
  }

  private async _getPoktTx(hash: string, requestId: string) {
    let proxyResponse: ProxyGetPoktTxRes;
    try {
      const message: ExternalGetPoktTxReq = {
        type: GET_POKT_TRANSACTION_REQUEST,
        requestId,
        data: {
          origin: window.location.origin,
          hash,
        },
      };
      const response: ExternalGetPoktTxRes = await browser.runtime.sendMessage(
        message
      );

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
      proxyResponse = {
        id: requestId,
        from: "VAULT_KEYRING",
        type: GET_POKT_TRANSACTION_RESPONSE,
        data: null,
        error: UnknownError,
      };
      window.postMessage(proxyResponse, window.location.origin);
    }
  }

  private async _sendSwitchChainRequest(
    protocol: SupportedProtocols,
    requestId: string,
    chainId: string
  ) {
    try {
      if (!chainId) {
        return this._sendSwitchChainResponse(
          requestId,
          propertyIsRequired("chainId")
        );
      }
      const message: ExternalSwitchChainReq = {
        type: SWITCH_CHAIN_REQUEST,
        requestId,
        data: {
          origin: window.location.origin,
          protocol,
          chainId,
          faviconUrl: this._getFaviconUrl(),
        },
      };

      const response: ExternalSwitchChainResToProxy =
        await browser.runtime.sendMessage(message);

      if (response?.type === SWITCH_CHAIN_RESPONSE) {
        this._sendSwitchChainResponse(
          response.requestId || requestId,
          response.error
        );
      }
    } catch (e) {
      const message: ProxySwitchChainRes = {
        id: requestId,
        from: "VAULT_KEYRING",
        type: SWITCH_CHAIN_RESPONSE,
        data: null,
        error: UnknownError,
      };
      window.postMessage(message, window.location.origin);
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
      from: "VAULT_KEYRING",
      type: SELECTED_ACCOUNT_CHANGED,
      protocol: param.protocol,
      data: {
        addresses: param.addresses,
      },
    };
    window.postMessage(message, window.location.origin);
  }

  private async _sendSignTypedDataRequest(
    protocol: SupportedProtocols,
    requestId: string,
    data: ProxySignTypedDataReq["data"]
  ) {
    try {
      const sessionId = this._sessionByProtocol[protocol]?.id;

      if (sessionId) {
        if (!isValidAddress(data.address, protocol)) {
          this._sendSignTypedResponse(
            requestId,
            null,
            propertyIsNotValid("address")
          );
        }

        const err = validateTypedDataPayload(data.data);

        if (err) {
          return this._sendSignTypedResponse(requestId, null, err);
        }

        const message: ExternalSignTypedDataReq = {
          type: SIGN_TYPED_DATA_REQUEST,
          requestId,
          data: {
            ...data,
            protocol,
            origin: window.location.origin,
            faviconUrl: this._getFaviconUrl(),
            sessionId,
          },
        };

        const response: ExternalSignTypedDataResToProxy =
          await browser.runtime.sendMessage(message);

        if (response?.type === SIGN_TYPED_DATA_RESPONSE) {
          this._sendSignTypedResponse(
            response.requestId || requestId,
            null,
            response.error
          );

          if (response?.error?.isSessionInvalid) {
            this._handleDisconnect(protocol);
          }
        }
      } else {
        return this._sendSignTypedResponse(requestId, null, UnauthorizedError);
      }
    } catch (e) {
      this._sendSignTypedResponse(requestId, null, UnknownError);
    }
  }

  private _handleSignTypedDataResponse(response: InternalSignedTypedDataRes) {
    try {
      const { error, data, requestId } = response;

      if (data) {
        this._sendSignTypedResponse(requestId, data.sign);
      } else {
        this._sendSignTypedResponse(requestId, null, error);
      }
    } catch (e) {
      this._sendSignTypedResponse(response?.requestId, null, UnknownError);
    }
  }

  private _sendSignTypedResponse(
    requestId: string,
    stringSigned: string | null,
    error?: ProxySignedTypedDataErrors
  ) {
    try {
      let response: ProxySignedTypedDataRes;

      if (error) {
        response = {
          id: requestId,
          type: SIGN_TYPED_DATA_RESPONSE,
          from: "VAULT_KEYRING",
          data: null,
          error,
        };
      } else {
        response = {
          id: requestId,
          type: SIGN_TYPED_DATA_RESPONSE,
          from: "VAULT_KEYRING",
          error: null,
          data: stringSigned,
        };
      }

      window.postMessage(response, window.location.origin);
    } catch (e) {
      window.postMessage(
        {
          id: requestId,
          type: SIGN_TYPED_DATA_RESPONSE,
          from: "VAULT_KEYRING",
          data: null,
          error: UnknownError,
        } as ProxySignedTypedDataRes,
        window.location.origin
      );
    }
  }

  private async _sendPersonalSignRequest(
    protocol: SupportedProtocols,
    requestId: string,
    data: ProxyPersonalSignReq["data"]
  ) {
    try {
      const sessionId = this._sessionByProtocol[protocol]?.id;

      if (sessionId) {
        if (!isValidAddress(data.address, protocol)) {
          this._sendPersonalSignResponse(
            requestId,
            null,
            propertyIsNotValid("address")
          );
        }

        if (!stringRegex.test(data?.challenge)) {
          this._sendPersonalSignResponse(
            requestId,
            null,
            propertyIsNotValid("challenge")
          );
        }

        const message: ExternalPersonalSignReq = {
          type: PERSONAL_SIGN_REQUEST,
          requestId,
          data: {
            ...data,
            protocol,
            sessionId,
            origin: window.location.origin,
            faviconUrl: this._getFaviconUrl(),
          },
        };

        const response: ExternalPersonalSignResToProxy =
          await browser.runtime.sendMessage(message);

        if (response?.type === PERSONAL_SIGN_RESPONSE) {
          this._sendSignTypedResponse(
            response.requestId || requestId,
            null,
            response.error
          );

          if (response?.error?.isSessionInvalid) {
            this._handleDisconnect(protocol);
          }
        }
      } else {
        return this._sendPersonalSignResponse(
          requestId,
          null,
          UnauthorizedError
        );
      }
    } catch (e) {
      this._sendPersonalSignResponse(requestId, null, UnknownError);
    }
  }

  private _handlePersonalSignResponse(response: InternalPersonalSignRes) {
    try {
      const { error, data, requestId } = response;

      if (data) {
        this._sendPersonalSignResponse(requestId, data.sign);
      } else {
        this._sendPersonalSignResponse(requestId, null, error);
      }
    } catch (e) {
      this._sendPersonalSignResponse(response?.requestId, null, UnknownError);
    }
  }

  private _sendPersonalSignResponse(
    requestId: string,
    stringSigned: string | null,
    error?
  ) {
    try {
      let response: ProxyPersonalSignRes;

      if (error) {
        response = {
          id: requestId,
          type: PERSONAL_SIGN_RESPONSE,
          from: "VAULT_KEYRING",
          data: null,
          error,
        };
      } else {
        response = {
          id: requestId,
          type: PERSONAL_SIGN_RESPONSE,
          from: "VAULT_KEYRING",
          error: null,
          data: stringSigned,
        };
      }

      window.postMessage(response, window.location.origin);
    } catch (e) {
      window.postMessage(
        {
          id: requestId,
          type: PERSONAL_SIGN_RESPONSE,
          from: "VAULT_KEYRING",
          data: null,
          error: UnknownError,
        } as ProxyPersonalSignRes,
        window.location.origin
      );
    }
  }
}

export default ProxyCommunicationController;
