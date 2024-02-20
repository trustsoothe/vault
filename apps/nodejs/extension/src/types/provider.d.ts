import {
  EthereumMethod,
  PocketNetworkMethod,
} from "../controllers/providers/base";
import {
  TEthTransferBody,
  TPocketTransferBody,
} from "../controllers/communication/Proxy";

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
  params: [TPocketTransferBody];
}

interface SendTransactionRequest {
  method: typeof EthereumMethod.SEND_TRANSACTION;
  params: [TEthTransferBody];
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

export interface SignTypedData {
  types: Record<string, { name: string; type: string }[]>;
  primaryType: string;
  domain: {
    name: string;
    verifyingContract: string;
    chainId?: number;
    version?: string;
  };
  message: Record<string, unknown>;
}

interface SignTypedDataRequest {
  method: typeof EthereumMethod.SIGN_TYPED_DATA;
  params: [string, SignTypedData];
}

interface PersonalSignRequest {
  method: typeof EthereumMethod.PERSONAL_SIGN;
  params: [string, string];
}

export type Method =
  | AccountRequest
  | ChainRequest
  | BalanceRequest
  | EthBalanceRequest
  | SendTransferRequest
  | SendTransactionRequest
  | ListAccountRequest
  | GetPoktTxRequest
  | SwitchChainRequest
  | SignTypedDataRequest
  | PersonalSignRequest;

export type SuccessfulCallback = (error: null, res: unknown) => unknown;
export type ErrorCallback = (error: unknown, res: null) => unknown;

type Callback = SuccessfulCallback | ErrorCallback;

export type ArgsOrCallback = Callback | Method["params"];
export type MethodOrPayload = Method | Method["method"];
