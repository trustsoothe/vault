import type { AccountsChangedToProvider } from "../../types/communications/accountChanged";
import type { AppIsReadyMessageToProvider } from "../../types/communications/appIsReady";
import type { ChainChangedToProvider } from "../../types/communications/chainChanged";
import type { ProxyRequests, ProxyResponses } from "../../types/communications";
import type {
  ArgsOrCallback,
  Method,
  MethodOrPayload,
} from "../../types/provider";
import { v4 } from "uuid";
import { EventEmitter } from "events";
import { SupportedProtocols } from "@poktscan/vault";
import {
  APP_IS_NOT_READY,
  APP_IS_READY,
  CONNECTION_REQUEST_MESSAGE,
  CONNECTION_RESPONSE_MESSAGE,
  EXTERNAL_ACCOUNT_BALANCE_REQUEST,
  EXTERNAL_ACCOUNT_BALANCE_RESPONSE,
  GET_POKT_TRANSACTION_REQUEST,
  GET_POKT_TRANSACTION_RESPONSE,
  LIST_ACCOUNTS_REQUEST,
  LIST_ACCOUNTS_RESPONSE,
  MINUTES_ALLOWED_FOR_REQ,
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
  ProviderNotReady,
  RequestTimeout,
  UnsupportedMethod,
} from "../../errors/communication";

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
  SIGN_TYPED_DATA = "eth_signTypedData_v4",
  PERSONAL_SIGN = "personal_sign",
}

export default class BaseProvider extends EventEmitter {
  readonly protocol: SupportedProtocols;
  readonly isSoothe = true;
  protected _isConnected = false;

  constructor(protocol: SupportedProtocols) {
    super();
    this.protocol = protocol;

    // this is required to prevent that this is undefined in these methods when the
    // provider is taken from the announcement event in some pages. For example: https://eip6963.org/
    this.send = this.send.bind(this);
    this.sendAsync = this.sendAsync.bind(this);
    this.request = this.request.bind(this);
    this.on = this.on.bind(this);

    window.addEventListener(
      "message",
      async (
        event: MessageEvent<
          | ChainChangedToProvider
          | AppIsReadyMessageToProvider
          | AccountsChangedToProvider
        >
      ) => {
        const { data, origin } = event;

        if (
          origin === window.location.origin &&
          data?.from === "VAULT_KEYRING" &&
          data.protocol === this.protocol
        ) {
          if (data.type === APP_IS_READY && !this._isConnected) {
            this._isConnected = true;
            this.emit("connect", data.data?.chainId);
          }

          if (data.type === SELECTED_ACCOUNT_CHANGED) {
            this._accountsChanged(data.data?.addresses);
          }

          if (data.type === SELECTED_CHAIN_CHANGED) {
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

  sendAsync(method: Method, callback: Function) {
    this.request(method)
      .then((res: any) => callback(null, res))
      .catch((err) => callback(err, null));
  }

  request(args: Method) {
    const { method, params } = args;

    let sootheRequestType: ProxyRequests["type"];

    if (!Object.values(SupportedProtocols).includes(this.protocol)) {
      throw Error(`protocol not supported: ${this.protocol}`);
    }

    if (
      (this.protocol === SupportedProtocols.Pocket &&
        !Object.values(PocketNetworkMethod).includes(
          method as PocketNetworkMethod
        )) ||
      (this.protocol === SupportedProtocols.Ethereum &&
        !Object.values(EthereumMethod).includes(method as EthereumMethod))
    ) {
      throw UnsupportedMethod;
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
      case EthereumMethod.SEND_TRANSACTION:
      case PocketNetworkMethod.SEND_TRANSACTION: {
        sootheRequestType = TRANSFER_REQUEST;
        break;
      }
      case PocketNetworkMethod.TX: {
        sootheRequestType = GET_POKT_TRANSACTION_REQUEST;
        break;
      }
      case EthereumMethod.SIGN_TYPED_DATA: {
        sootheRequestType = SIGN_TYPED_DATA_REQUEST;
        break;
      }
      case EthereumMethod.PERSONAL_SIGN: {
        sootheRequestType = PERSONAL_SIGN_REQUEST;
        break;
      }
      default: {
        throw Error(`method not supported: ${method}`);
      }
    }

    let responseType: ProxyResponses["type"],
      requestData: ProxyRequests["data"] = undefined;

    switch (sootheRequestType as ProxyRequests["type"]) {
      case SELECTED_CHAIN_REQUEST:
        responseType = SELECTED_CHAIN_RESPONSE;
        requestData = {
          protocol: this.protocol,
        };
        break;
      case EXTERNAL_ACCOUNT_BALANCE_REQUEST:
        responseType = EXTERNAL_ACCOUNT_BALANCE_RESPONSE;

        const address =
          this.protocol === SupportedProtocols.Ethereum
            ? params?.[0]
            : params?.[0]?.address;

        requestData = {
          address,
          block: params?.[1] || "latest",
          protocol: this.protocol,
        };
        break;
      case CONNECTION_REQUEST_MESSAGE:
        responseType = CONNECTION_RESPONSE_MESSAGE;
        break;
      case TRANSFER_REQUEST:
        responseType = TRANSFER_RESPONSE;
        requestData = params?.[0];
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
      case SIGN_TYPED_DATA_REQUEST: {
        responseType = SIGN_TYPED_DATA_RESPONSE;
        requestData = {
          address: params?.[0],
          data: params?.[1],
        };
        break;
      }
      case PERSONAL_SIGN_REQUEST: {
        responseType = PERSONAL_SIGN_RESPONSE;
        requestData = {
          address: params?.[1],
          challenge: params?.[0],
        };
        break;
      }
    }

    const id = v4();

    window.postMessage(
      {
        type: sootheRequestType,
        protocol: this.protocol,
        data: requestData,
        to: "VAULT_KEYRING",
        id,
      } as ProxyRequests,
      window.location.origin
    );

    return new window.Promise((resolve, reject) => {
      const listener = (event: MessageEvent<ProxyResponses>) => {
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
            return reject(ProviderNotReady);
          }

          const { data, error } = event.data;

          if (data || (data === null && !error)) {
            if (data && typeof data === "object" && "rejected" in data) {
              delete data.rejected;
            }

            let dataToResolve = data;

            if (this.protocol === SupportedProtocols.Pocket) {
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

            if (navigator.userAgent.includes("Firefox")) {
              // @ts-ignore
              dataToResolve = cloneInto(dataToResolve, window);
            }

            return resolve(dataToResolve);
          } else {
            return reject(error);
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
