import { PocketNetworkMethod } from "../controllers/providers/base";

interface AccountRequest {
  method:
    | typeof PocketNetworkMethod.ACCOUNTS
    | typeof PocketNetworkMethod.REQUEST_ACCOUNTS;
  params?: unknown;
}

interface ChainRequest {
  method: typeof PocketNetworkMethod.CHAIN;
  params?: unknown;
}

export type Method = AccountRequest | ChainRequest;

export type SuccessfulCallback = (error: null, res: unknown) => unknown;
export type ErrorCallback = (error: unknown, res: null) => unknown;

type Callback = SuccessfulCallback | ErrorCallback;

export type ArgsOrCallback = Callback | Method["params"];
export type MethodOrPayload = Method | Method["method"];
