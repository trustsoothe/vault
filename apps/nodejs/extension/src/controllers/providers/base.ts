import type {
  ArgsOrCallback,
  Method,
  MethodOrPayload,
} from "../../types/provider";
import type { AccountsChangedToProvider } from "../../types/communication";
import type { BrowserRequest, BrowserResponse } from "../../types";
import { v4 } from "uuid";
import { EventEmitter } from "events";
import { SupportedProtocols } from "@poktscan/keyring";
import {
  APP_IS_NOT_READY,
  APP_IS_READY,
  CHECK_CONNECTION_REQUEST,
  CONNECTION_REQUEST_MESSAGE,
  CONNECTION_RESPONSE_MESSAGE,
  DISCONNECT_REQUEST,
  DISCONNECT_RESPONSE,
  EXTERNAL_ACCOUNT_BALANCE_REQUEST,
  EXTERNAL_ACCOUNT_BALANCE_RESPONSE,
  GET_POKT_TRANSACTION_REQUEST,
  GET_POKT_TRANSACTION_RESPONSE,
  LIST_ACCOUNTS_REQUEST,
  LIST_ACCOUNTS_RESPONSE,
  MINUTES_ALLOWED_FOR_REQ,
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
import { ProviderNotReady, RequestTimeout } from "../../errors/communication";

interface ChainChangedMessage {
  type: typeof SELECTED_CHAIN_CHANGED;
  to: "VAULT_KEYRING";
  network: SupportedProtocols;
  data: {
    chainId: string;
  };
}

export interface AppIsReadyMessage {
  type: typeof APP_IS_READY;
  to: "VAULT_KEYRING";
  network: SupportedProtocols;
  data: {
    chainId: string;
  };
}

export enum PocketNetworkMethod {
  REQUEST_ACCOUNTS = "pokt_requestAccounts",
  ACCOUNTS = "pokt_accounts",
  BALANCE = "pokt_balance",
  SEND_TRANSACTION = "pokt_sendTransaction",
  TX = "pokt_tx",
  CHAIN = "pokt_chain",
  SWITCH_CHAIN = "wallet_switchPocketChain",
  // HEIGHT = "pokt_height",
  // BLOCK = 'pokt_block',
}

export enum EthereumMethod {
  REQUEST_ACCOUNTS = "eth_requestAccounts",
  ACCOUNTS = "eth_accounts",
  BALANCE = "eth_getBalance",
  SEND_TRANSACTION = "eth_sendTransaction",
  CHAIN = "eth_chainId",
  SWITCH_CHAIN = "wallet_switchEthereumChain",
}

export default class BaseProvider extends EventEmitter {
  readonly network: SupportedProtocols;
  readonly isSoothe = true;
  protected _isConnected = false;

  constructor(protocol: SupportedProtocols) {
    super();
    this.network = protocol;

    Object.defineProperty(this, "network", {
      configurable: false,
      writable: false,
    });

    window.addEventListener(
      "message",
      async (
        event: MessageEvent<
          | (BrowserRequest & { network: SupportedProtocols })
          | ChainChangedMessage
          | AppIsReadyMessage
          | AccountsChangedToProvider
        >
      ) => {
        const { data, origin } = event;

        if (
          origin === window.location.origin &&
          data?.to === "VAULT_KEYRING" &&
          data?.network === this.network
        ) {
          if (data?.type === APP_IS_READY && !this._isConnected) {
            this._isConnected = true;
            this.emit("connect", data?.data?.chainId);
          }

          if (data?.type === SELECTED_ACCOUNT_CHANGED) {
            this._accountsChanged(data.data?.addresses);
          }

          if (data?.type === SELECTED_CHAIN_CHANGED) {
            this._chainChanged(data.data.chainId);
          }
        }
      }
    );
  }

  private _accountsChanged(addresses: string[]) {
    this.emit("accountsChanged", addresses);
  }

  send(methodOrPayload: MethodOrPayload, argsOrCallback?: ArgsOrCallback) {
    if (!methodOrPayload) {
      throw Error("method or payload should be passed");
    }

    if (
      typeof methodOrPayload === "string" &&
      (!argsOrCallback || Array.isArray(argsOrCallback))
    ) {
      // @ts-ignore
      return this.request({
        method: methodOrPayload,
        params: argsOrCallback,
      });
    } else if (
      typeof methodOrPayload === "object" &&
      typeof argsOrCallback === "function"
    ) {
      this.request(methodOrPayload)
        .then((res: any) => argsOrCallback(null, res))
        .catch((err) => argsOrCallback(err, null));
    }
  }

  async request(args: Method) {
    const { method, params } = args;

    let sootheRequestType: BrowserRequest["type"];

    if (!Object.values(SupportedProtocols).includes(this.network)) {
      throw Error(`protocol not supported: ${this.network}`);
    }

    if (
      (this.network === SupportedProtocols.Pocket &&
        !Object.values(PocketNetworkMethod).includes(
          method as PocketNetworkMethod
        )) ||
      (this.network === SupportedProtocols.Ethereum &&
        !Object.values(EthereumMethod).includes(method as EthereumMethod))
    ) {
      throw Error(`method not supported: ${method}`);
    }

    switch (method) {
      case EthereumMethod.REQUEST_ACCOUNTS:
      case PocketNetworkMethod.REQUEST_ACCOUNTS: {
        sootheRequestType = CONNECTION_REQUEST_MESSAGE;
        break;
      }
      case EthereumMethod.ACCOUNTS:
      case PocketNetworkMethod.ACCOUNTS: {
        sootheRequestType = LIST_ACCOUNTS_REQUEST;
        break;
      }
      case EthereumMethod.CHAIN:
      case PocketNetworkMethod.CHAIN: {
        sootheRequestType = SELECTED_CHAIN_REQUEST;
        break;
      }
      case EthereumMethod.SWITCH_CHAIN:
      case PocketNetworkMethod.SWITCH_CHAIN: {
        sootheRequestType = SWITCH_CHAIN_REQUEST;
        break;
      }
      case EthereumMethod.BALANCE:
      case PocketNetworkMethod.BALANCE: {
        sootheRequestType = EXTERNAL_ACCOUNT_BALANCE_REQUEST;
        break;
      }
      // case EthereumMethod.SEND_TRANSACTION:
      case PocketNetworkMethod.SEND_TRANSACTION: {
        sootheRequestType = TRANSFER_REQUEST;
        break;
      }
      case PocketNetworkMethod.TX: {
        sootheRequestType = GET_POKT_TRANSACTION_REQUEST;
        break;
      }
      default: {
        throw Error(`method not supported: ${method}`);
      }
    }

    let responseType: BrowserResponse["type"],
      requestData: BrowserRequest["data"] = undefined;

    switch (sootheRequestType as BrowserRequest["type"]) {
      case CHECK_CONNECTION_REQUEST:
        responseType = CONNECTION_RESPONSE_MESSAGE;
        break;
      case SELECTED_CHAIN_REQUEST:
        responseType = SELECTED_CHAIN_RESPONSE;
        requestData = {
          protocol: this.network,
        };
        break;
      case EXTERNAL_ACCOUNT_BALANCE_REQUEST:
        responseType = EXTERNAL_ACCOUNT_BALANCE_RESPONSE;

        const address =
          this.network === SupportedProtocols.Ethereum
            ? params?.[0]
            : params?.[0]?.address;

        requestData = {
          address,
          block: params?.[1] || "latest",
          protocol: this.network,
        };
        break;
      case CONNECTION_REQUEST_MESSAGE:
        responseType = CONNECTION_RESPONSE_MESSAGE;
        break;
      case NEW_ACCOUNT_REQUEST:
        responseType = NEW_ACCOUNT_RESPONSE;
        break;
      case TRANSFER_REQUEST:
        responseType = TRANSFER_RESPONSE;
        requestData = params?.[0];
        break;
      case DISCONNECT_REQUEST:
        responseType = DISCONNECT_RESPONSE;
        break;
      case LIST_ACCOUNTS_REQUEST:
        responseType = LIST_ACCOUNTS_RESPONSE;
        break;
      case GET_POKT_TRANSACTION_REQUEST: {
        responseType = GET_POKT_TRANSACTION_RESPONSE;
        requestData = {
          hash: params?.[0]?.hash,
        };
        break;
      }
      case SWITCH_CHAIN_REQUEST: {
        responseType = SWITCH_CHAIN_RESPONSE;
        requestData = {
          chainId: params?.[0]?.chainId,
        };
        break;
      }
    }

    const id = v4();

    window.postMessage(
      {
        type: sootheRequestType,
        network: this.network,
        data: requestData,
        to: "VAULT_KEYRING",
        id,
      } as BrowserRequest,
      window.location.origin
    );

    return new Promise((resolve, reject) => {
      const listener = (event: MessageEvent<BrowserResponse>) => {
        if (
          (responseType === event.data.type ||
            event.data.type === APP_IS_NOT_READY) &&
          event.origin === window.location.origin &&
          event.source === window &&
          event.data?.from === "VAULT_KEYRING" &&
          event.data?.id === id
        ) {
          window.removeEventListener("message", listener);

          if (event.data.type === "APP_IS_NOT_READY") {
            reject(ProviderNotReady);
          }

          const { data, error } = event.data;

          if (data || (data === null && !error)) {
            if (data && typeof data === "object" && "rejected" in data) {
              delete data.rejected;
            }

            let dataToResolve = data;

            if (this.network === SupportedProtocols.Pocket) {
              if (responseType === TRANSFER_RESPONSE) {
                // data is expected to be the transaction hash string
                dataToResolve = { hash: data };
              }

              if (responseType === EXTERNAL_ACCOUNT_BALANCE_RESPONSE) {
                // data is expected to be the balance in uPOKT of the address
                dataToResolve = { balance: data };
              }

              if (responseType === SELECTED_CHAIN_RESPONSE) {
                // data is expected to be the chain selected for pocket
                dataToResolve = { chain: data };
              }
            }

            resolve(dataToResolve);
          } else {
            reject(error);
          }
        }
      };

      window.addEventListener("message", listener);

      // the background has a timeout, this is just in case
      setTimeout(() => {
        window.removeEventListener("message", listener);
        reject(RequestTimeout);
      }, (MINUTES_ALLOWED_FOR_REQ + 1) * 60000);
    });
  }

  private _chainChanged(newChainId: string) {
    this.emit("chainChanged", newChainId);
  }
}
