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

interface PublicKeyRequest {
  method: typeof PocketNetworkMethod.PUBLIC_KEY;
  params: [{ address: string }];
}

interface SignMessageRequest {
  method: typeof PocketNetworkMethod.SIGN_MESSAGE;
  params: [{ address: string; message: string }];
}

interface StakeNodeRequest {
  method: typeof PocketNetworkMethod.STAKE_NODE;
  params: [
    {
      amount: string;
      chains: string[];
      serviceURL: string;
      address: string;
      operatorPublicKey?: string;
      rewardDelegators?: Record<string, number>;
    }
  ];
}

interface UnstakeNodeRequest {
  method: typeof PocketNetworkMethod.UNSTAKE_NODE;
  params: [
    {
      nodeAddress: string;
      address: string;
    }
  ];
}

interface UnjailNodeRequest {
  method: typeof PocketNetworkMethod.UNJAIL_NODE;
  params: [
    {
      nodeAddress: string;
      address: string;
    }
  ];
}

interface StakeAppRequest {
  method: typeof PocketNetworkMethod.STAKE_APP;
  params: [
    {
      address: string;
      amount: string;
      chains: string[];
    }
  ];
}

interface TransferAppRequest {
  method: typeof PocketNetworkMethod.TRANSFER_APP;
  params: [
    {
      address: string;
      newAppPublicKey: string;
    }
  ];
}

interface UnstakeAppRequest {
  method: typeof PocketNetworkMethod.UNSTAKE_APP;
  params: [
    {
      address: string;
    }
  ];
}

interface ChangeParamRequest {
  method: typeof PocketNetworkMethod.CHANGE_PARAM;
  params: [
    {
      address: string;
      paramKey: string;
      paramValue: string;
      overrideGovParamsWhitelistValidation: boolean;
    }
  ];
}

interface DaoTransferRequest {
  method: typeof PocketNetworkMethod.DAO_TRANSFER;
  params: [
    {
      address: string;
      to: string;
      amount: string;
      daoAction: string;
    }
  ];
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
  | PersonalSignRequest
  | SignMessageRequest
  | StakeNodeRequest
  | UnstakeNodeRequest
  | UnjailNodeRequest
  | StakeAppRequest
  | TransferAppRequest
  | UnstakeAppRequest
  | ChangeParamRequest
  | DaoTransferRequest
  | PublicKeyRequest;

export type SuccessfulCallback = (error: null, res: unknown) => unknown;
export type ErrorCallback = (error: unknown, res: null) => unknown;

type Callback = SuccessfulCallback | ErrorCallback;

export type ArgsOrCallback = Callback | Method["params"];
export type MethodOrPayload = Method | Method["method"];
