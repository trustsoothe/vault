import { EventEmitter } from "events";
import { SupportedProtocols } from "@poktscan/keyring";
import type { BrowserRequest } from "../../types";
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
  SELECTED_CHAIN_CHANGED,
  TRANSFER_REQUEST,
  TRANSFER_RESPONSE,
} from "../../constants/communication";
import { BrowserResponse } from "../../types";
import { RequestTimeout } from "../../errors/communication";
import { ArgsOrCallback, Method, MethodOrPayload } from "../../types/provider";

interface ChainChangedMessage {
  type: typeof SELECTED_CHAIN_CHANGED;
  to: "VAULT_KEYRING";
  network: SupportedProtocols;
  data: {
    chainId: string;
  };
}

function getRandomInt() {
  return Math.floor(
    Math.random() * (Number.MAX_SAFE_INTEGER + 1)
  ).toLocaleString();
}

export enum PocketNetworkMethod {
  REQUEST_ACCOUNTS = "pokt_requestAccounts",
  ACCOUNTS = "pokt_accounts",
  BALANCE = "pokt_balance",
  SEND_TRANSACTION = "pokt_sendTransaction",
  TX = "pokt_tx",
  HEIGHT = "pokt_height",
  CHAIN = "pokt_chain",
  // BLOCK = 'pokt_block',
}

export default class BaseProvider extends EventEmitter {
  chainId: string;
  readonly network: SupportedProtocols;
  readonly isSoothe = true;
  selectedAddress: string;

  constructor(protocol: SupportedProtocols) {
    super();
    this.network = protocol;

    window.addEventListener(
      "message",
      async (
        event: MessageEvent<
          | (BrowserRequest & { network: SupportedProtocols })
          | ChainChangedMessage
        >
      ) => {
        const { data, origin } = event;

        if (
          origin === window.location.origin &&
          data?.to === "VAULT_KEYRING" &&
          data?.network === this.network
        ) {
          // if (data?.type === 'SELECTED_ACCOUNT_CHANGED') {}
          if (data?.type === SELECTED_CHAIN_CHANGED) {
            this._chainChanged(data.data.chainId);
          }
        }
      }
    );
  }

  send(methodOrPayload: MethodOrPayload, argsOrCallback?: ArgsOrCallback) {
    if (!methodOrPayload) {
      throw Error("method or payload should be passed");
    }

    if (
      typeof methodOrPayload === "string" &&
      (!argsOrCallback || Array.isArray(argsOrCallback))
    ) {
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

    switch (method) {
      case PocketNetworkMethod.ACCOUNTS:
      case PocketNetworkMethod.REQUEST_ACCOUNTS: {
        sootheRequestType = CONNECTION_REQUEST_MESSAGE;
        break;
      }
      case PocketNetworkMethod.CHAIN: {
        return { chain: this.chainId };
      }
      default: {
        throw Error(`method not supported: ${method}`);
      }
    }

    if (!sootheRequestType) {
      if (PocketNetworkMethod.CHAIN) {
        return this.chainId;
      }
    }

    let responseType: BrowserResponse["type"];

    switch (sootheRequestType as BrowserRequest["type"]) {
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
        type: sootheRequestType,
        network: this.network,
        data: undefined,
        to: "VAULT_KEYRING",
      } as BrowserRequest,
      window.location.origin
    );

    return new Promise((resolve, reject) => {
      const listener = (event: MessageEvent<BrowserResponse>) => {
        if (
          responseType === event.data.type &&
          event.origin === window.location.origin &&
          event.source === window &&
          event.data?.from === "VAULT_KEYRING"
        ) {
          window.removeEventListener("message", listener);

          const { data, error } = event.data;

          if (data) {
            if ("rejected" in data) {
              delete data.rejected;
            }

            resolve(data);
          } else {
            reject(error);
          }
        }
      };

      window.addEventListener("message", listener);

      setTimeout(() => {
        window.removeEventListener("message", listener);
        reject(RequestTimeout);
      }, (MINUTES_ALLOWED_FOR_REQ + 1) * 60000);
    });
  }

  private _chainChanged(newChainId: string) {
    this.chainId = newChainId;
    this.emit("chainChanged", this.chainId);
  }
}
