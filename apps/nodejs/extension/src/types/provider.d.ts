import {
  EthereumMethod,
  PocketNetworkMethod,
} from "../controllers/providers/base";
import {
  TEthTransferBody,
  TPocketTransferBody,
} from "../controllers/communication/Proxy";
import type {
  PocketNetworkAppStake,
  PocketNetworkAppTransfer,
  PocketNetworkAppUnstake,
  PocketNetworkGovChangeParam,
  PocketNetworkGovDAOTransfer,
  PocketNetworkGovUpgrade,
  PocketNetworkNodeStake,
  PocketNetworkNodeUnjail,
  PocketNetworkNodeUnstake,
  PocketNetworkSend,
} from "@soothe/vault";
import { SignTransactionBodyShannon } from "./communications/transactions";

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

interface BulkSignMessageRequest {
  method: typeof PocketNetworkMethod.BULK_SIGN_MESSAGE;
  params: Array<{ id?: string; address: string; message: string }>;
}

interface StakeNodeBody {
  amount: string;
  chains: string[];
  serviceURL: string;
  address: string;
  operatorPublicKey?: string;
  rewardDelegators?: Record<string, number>;
}

interface StakeNodeRequest {
  method: typeof PocketNetworkMethod.STAKE_NODE;
  params: [StakeNodeBody];
}

interface UnstakeAndUnjailNodeBody {
  nodeAddress: string;
  address: string;
}

interface UnstakeNodeRequest {
  method: typeof PocketNetworkMethod.UNSTAKE_NODE;
  params: [UnstakeAndUnjailNodeBody];
}

interface UnjailNodeRequest {
  method: typeof PocketNetworkMethod.UNJAIL_NODE;
  params: [UnstakeAndUnjailNodeBody];
}

interface StakeAppBody {
  address: string;
  amount: string;
  chains: string[];
}

interface StakeAppRequest {
  method: typeof PocketNetworkMethod.STAKE_APP;
  params: [StakeAppBody];
}

interface TransferAppBody {
  address: string;
  newAppPublicKey: string;
}

interface TransferAppRequest {
  method: typeof PocketNetworkMethod.TRANSFER_APP;
  params: [TransferAppBody];
}

interface UnstakeAppBody {
  address: string;
}

interface UnstakeAppRequest {
  method: typeof PocketNetworkMethod.UNSTAKE_APP;
  params: [UnstakeAppBody];
}

interface ChangeParamBody {
  address: string;
  paramKey: string;
  paramValue: string;
  overrideGovParamsWhitelistValidation: boolean;
}

interface ChangeParamRequest {
  method: typeof PocketNetworkMethod.CHANGE_PARAM;
  params: [];
}

interface DaoTransferBody {
  address: string;
  to: string;
  amount: string;
  daoAction: string;
}

interface DaoTransferRequest {
  method: typeof PocketNetworkMethod.DAO_TRANSFER;
  params: [DaoTransferBody];
}

interface UpgradeBody {
  address: string;
  height: number;
  version: string;
  features: string[];
}

interface UpgradeRequest {
  method: typeof PocketNetworkMethod.UPGRADE;
  params: [UpgradeBody];
}

interface SignAppStakeBody {
  type: typeof PocketNetworkAppStake;
  transaction: StakeAppBody;
}

interface SignAppTransferBody {
  type: typeof PocketNetworkAppTransfer;
  transaction: TransferAppBody;
}

interface SignAppUnstakeBody {
  type: typeof PocketNetworkAppUnstake;
  transaction: UnstakeAppBody;
}

interface SignGovChangeParamBody {
  type: typeof PocketNetworkGovChangeParam;
  transaction: ChangeParamBody;
}

interface SignGovDAOTransferBody {
  type: typeof PocketNetworkGovDAOTransfer;
  transaction: DaoTransferBody;
}

interface SignGovUpgradeBody {
  type: typeof PocketNetworkGovUpgrade;
  transaction: UpgradeBody;
}

interface SignNodeStakeBody {
  type: typeof PocketNetworkNodeStake;
  transaction: StakeNodeBody;
}

interface SignNodeUnjailBody {
  type: typeof PocketNetworkNodeUnjail;
  transaction: UnstakeAndUnjailNodeBody;
}

interface SignNodeUnstakeBody {
  type: typeof PocketNetworkNodeUnstake;
  transaction: UnstakeAndUnjailNodeBody;
}

interface SignSendBody {
  type: typeof PocketNetworkSend;
  transaction: TPocketTransferBody;
}

type SignTransactionBodyMorse =
  | SignAppStakeBody
  | SignAppTransferBody
  | SignAppUnstakeBody
  | SignGovChangeParamBody
  | SignGovDAOTransferBody
  | SignGovUpgradeBody
  | SignNodeStakeBody
  | SignNodeUnjailBody
  | SignNodeUnstakeBody
  | SignSendBody;

interface SignTransactionRequestMorse {
  method: typeof PocketNetworkMethod.SIGN_TRANSACTION;
  params: [SignTransactionBodyMorse];
}

interface BulkSignTransactionRequestMorse {
  method: typeof PocketNetworkMethod.BULK_SIGN_TRANSACTION;
  params: Array<SignTransactionBodyMorse>;
}

interface SignTransactionRequestShannon {
  method: typeof PocketNetworkMethod.SIGN_TRANSACTION;
  params: [SignTransactionBodyShannon];
}

interface BulkSignTransactionRequestShannon {
  method: typeof PocketNetworkMethod.BULK_SIGN_TRANSACTION;
  params: Array<SignTransactionBodyShannon>;
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
  | BulkSignMessageRequest
  | StakeNodeRequest
  | UnstakeNodeRequest
  | UnjailNodeRequest
  | StakeAppRequest
  | TransferAppRequest
  | UnstakeAppRequest
  | ChangeParamRequest
  | DaoTransferRequest
  | UpgradeRequest
  | PublicKeyRequest
  | SignTransactionRequestShannon
  | BulkSignTransactionRequestShannon
  | SignTransactionRequestMorse
  | BulkSignTransactionRequestMorse;

export type SuccessfulCallback = (error: null, res: unknown) => unknown;
export type ErrorCallback = (error: unknown, res: null) => unknown;

type Callback = SuccessfulCallback | ErrorCallback;

export type ArgsOrCallback = Callback | Method["params"];
export type MethodOrPayload = Method | Method["method"];
