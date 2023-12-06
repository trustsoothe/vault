import {
  EthereumMethod,
  PocketNetworkMethod,
} from "../controllers/providers/base";

interface AccountRequest {
  method:
    | typeof PocketNetworkMethod.REQUEST_ACCOUNTS
    | typeof EthereumMethod.REQUEST_ACCOUNTS;
  params?: unknown;
}

interface ListAccountRequest {
  method: typeof PocketNetworkMethod.ACCOUNTS | typeof EthereumMethod.ACCOUNTS;
  params?: unknown;
}

interface ChainRequest {
  method: typeof PocketNetworkMethod.CHAIN | typeof EthereumMethod.CHAIN;
  params?: unknown;
}

interface BalanceRequest {
  method: typeof PocketNetworkMethod.BALANCE;
  params: [{ address: string }];
}

interface EthBalanceRequest {
  method: typeof EthereumMethod.BALANCE;
  params: [string];
}

interface SendTransferRequest {
  method: typeof PocketNetworkMethod.SEND_TRANSACTION;
  params: [
    {
      from: string;
      to: string;
      amount: string;
      memo?: string;
    }
  ];
}

interface SwitchChainRequest {
  method:
    | typeof PocketNetworkMethod.SWITCH_CHAIN
    | typeof EthereumMethod.SWITCH_CHAIN;
  params: [
    {
      chainId: string;
    }
  ];
}

interface GetPoktTxRequest {
  method: typeof PocketNetworkMethod.TX;
  params: [{ hash: string }];
}

export type Method =
  | AccountRequest
  | ChainRequest
  | BalanceRequest
  | EthBalanceRequest
  | SendTransferRequest
  | ListAccountRequest
  | GetPoktTxRequest
  | SwitchChainRequest;

export type SuccessfulCallback = (error: null, res: unknown) => unknown;
export type ErrorCallback = (error: unknown, res: null) => unknown;

type Callback = SuccessfulCallback | ErrorCallback;

export type ArgsOrCallback = Callback | Method["params"];
export type MethodOrPayload = Method | Method["method"];
