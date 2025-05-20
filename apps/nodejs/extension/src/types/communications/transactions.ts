import type {
  BaseData,
  BaseErrors,
  BaseExternalRequestBodyWithSession,
  BaseExternalRequestWithSession,
  BaseProxyRequest,
  BaseProxyResponse,
  BaseResponse,
  RequestBeingHandledRes,
} from "./common";
import {
  ANSWER_BULK_SIGN_TRANSACTION_REQUEST,
  ANSWER_BULK_SIGN_TRANSACTION_RESPONSE,
  ANSWER_CHANGE_PARAM_REQUEST,
  ANSWER_CHANGE_PARAM_RESPONSE,
  ANSWER_DAO_TRANSFER_REQUEST,
  ANSWER_DAO_TRANSFER_RESPONSE,
  ANSWER_STAKE_APP_REQUEST,
  ANSWER_STAKE_APP_RESPONSE,
  ANSWER_STAKE_NODE_REQUEST,
  ANSWER_STAKE_NODE_RESPONSE,
  ANSWER_TRANSFER_APP_REQUEST,
  ANSWER_TRANSFER_APP_RESPONSE,
  ANSWER_UNJAIL_NODE_REQUEST,
  ANSWER_UNJAIL_NODE_RESPONSE,
  ANSWER_UNSTAKE_APP_REQUEST,
  ANSWER_UNSTAKE_APP_RESPONSE,
  ANSWER_UNSTAKE_NODE_REQUEST,
  ANSWER_UNSTAKE_NODE_RESPONSE,
  ANSWER_UPGRADE_REQUEST,
  ANSWER_UPGRADE_RESPONSE,
  ANSWER_VALIDATE_POKT_TX_REQUEST,
  ANSWER_VALIDATE_POKT_TX_RESPONSE,
  BULK_SIGN_TRANSACTION_REQUEST,
  BULK_SIGN_TRANSACTION_RESPONSE,
  CHANGE_PARAM_REQUEST,
  CHANGE_PARAM_RESPONSE,
  DAO_TRANSFER_REQUEST,
  DAO_TRANSFER_RESPONSE,
  SIGN_TRANSACTION_REQUEST,
  STAKE_APP_REQUEST,
  STAKE_APP_RESPONSE,
  STAKE_NODE_REQUEST,
  STAKE_NODE_RESPONSE,
  TRANSFER_APP_REQUEST,
  TRANSFER_APP_RESPONSE,
  UNJAIL_NODE_REQUEST,
  UNJAIL_NODE_RESPONSE,
  UNSTAKE_APP_REQUEST,
  UNSTAKE_APP_RESPONSE,
  UNSTAKE_NODE_REQUEST,
  UNSTAKE_NODE_RESPONSE,
  UPGRADE_REQUEST,
  UPGRADE_RESPONSE,
} from "../../constants/communication";
import {
  ChangeParamBody,
  DaoTransferBody,
  StakeAppBody,
  StakeNodeBody,
  TPocketTransferBody,
  TransferAppBody,
  UnstakeAppBody,
  UnstakeNodeBody,
  UpgradeBody,
} from "../../controllers/communication/Proxy";
import {
  OperationRejected,
  propertyIsNotValid,
  propertyIsRequired,
  RequestChangeParamExists,
  RequestDaoTransferExists,
  RequestSignTransactionExists,
  RequestStakeAppExists,
  RequestStakeNodeExists,
  RequestTimeout,
  RequestTransferAppExists,
  RequestUnjailNodeExists,
  RequestUnstakeAppExists,
  RequestUnstakeNodeExists,
  RequestUpgradeExists,
  SessionIdNotPresented,
  UnauthorizedError,
  UnauthorizedErrorSessionInvalid,
  UnknownError,
} from "../../errors/communication";
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
  SupportedProtocols,
  ValidateTransactionResult,
} from "@soothe/vault";
import type { UnstakeAndUnjailNodeBody } from "../provider";

export type ExternalBasePoktTxErrors =
  | BaseErrors
  | typeof RequestTimeout
  | typeof SessionIdNotPresented
  | typeof UnauthorizedError
  | typeof UnauthorizedErrorSessionInvalid;

export type AnswerBasePoktTxResponseData<TData = { hash: string }> =
  BaseData & {
    isPasswordWrong?: boolean;
  } & TData;

type BaseError = {
  code: number;
  message: string;
};

export type ExternalResponse<
  T extends string,
  E extends BaseError = BaseError
> =
  | (BaseResponse<T, null, ExternalBasePoktTxErrors | E> & {
      requestId: string;
    })
  | void;

export interface InternalResponse<T extends string, TData = { hash: string }> {
  type: T;
  requestId: string;
  data: {
    rejected: boolean;
    protocol: SupportedProtocols | null;
  } & TData;
  error: null | typeof UnknownError | typeof OperationRejected;
}

export type ProxyPoktTxRes<T extends string, TData = { hash: string }> =
  | (BaseProxyResponse & {
      type: T;
      data: null;
      error:
        | typeof OperationRejected
        | ReturnType<typeof propertyIsRequired>
        | ReturnType<typeof propertyIsNotValid>
        | null;
    })
  | (BaseProxyResponse & {
      type: T;
      data: TData;
      error: null;
    });

export type AnswerBasePoktTxReq<
  T extends string,
  TBody,
  TKey extends "transactionData" | "data" = "transactionData"
> = {
  type: T;
  data: {
    rejected?: boolean;
    vaultPassword?: string;
    fee: number;
    request?: {
      tabId: number;
      origin: string;
      requestId: string;
      protocol: SupportedProtocols;
    } | null;
  } & OneKeyType<TKey, TBody & { chainId: string }>;
};

type OneKeyType<T extends string, TBody> = {
  [K in T]: { [P in K]: TBody };
}[T];

type Creator<
  TReq extends string,
  TBody,
  TErrorExists extends BaseError,
  TInReq extends string,
  TInRes extends string,
  TRes extends string,
  TKey extends "transactionData" | "data" = "transactionData",
  TData = { hash: string }
> = {
  ProxyReq: BaseProxyRequest & {
    type: TReq;
    data: TBody;
  };
  ExternalReq: {
    type: TReq;
    requestId: string;
    data: BaseExternalRequestBodyWithSession & OneKeyType<TKey, TBody>;
  };
  AppReq: BaseExternalRequestWithSession<TReq> &
    OneKeyType<TKey, TBody & { chainId: string }>;
  ExternalRes: ExternalResponse<TRes, TErrorExists>;
  AnswerReq: AnswerBasePoktTxReq<TInReq, TBody, TKey>;
  AnswerRes: BaseResponse<TInRes, AnswerBasePoktTxResponseData<TData>>;
  InternalRes: InternalResponse<TRes, TData>;
  ExternalResToProxy:
    | Extract<ExternalResponse<TRes, BaseError>, { data: null }>
    | RequestBeingHandledRes;
  ResponseFromBack:
    | Extract<ExternalResponse<TRes, TErrorExists>, { data: null }>
    | InternalResponse<TRes>;
  ProxyRes: ProxyPoktTxRes<TRes, TData>;
};

// Stake Node
type StakeNodeCreator = Creator<
  typeof STAKE_NODE_REQUEST,
  StakeNodeBody & { nodeAddress?: string },
  typeof RequestStakeNodeExists,
  typeof ANSWER_STAKE_NODE_REQUEST,
  typeof ANSWER_STAKE_NODE_RESPONSE,
  typeof STAKE_NODE_RESPONSE
>;

export type ProxyStakeNodeReq = StakeNodeCreator["ProxyReq"];
export type ExternalStakeNodeReq = StakeNodeCreator["ExternalReq"];
export type AppStakeNodeReq = StakeNodeCreator["AppReq"];
export type AnswerStakeNodeReq = StakeNodeCreator["AnswerReq"];
export type AnswerStakeNodeRes = StakeNodeCreator["AnswerRes"];
export type InternalStakeNodeRes = StakeNodeCreator["InternalRes"];
export type ProxyStakeNodeRes = StakeNodeCreator["ProxyRes"];

// Unstake Node

type UnstakeNodeCreator = Creator<
  typeof UNSTAKE_NODE_REQUEST,
  UnstakeNodeBody,
  typeof RequestUnstakeNodeExists,
  typeof ANSWER_UNSTAKE_NODE_REQUEST,
  typeof ANSWER_UNSTAKE_NODE_RESPONSE,
  typeof UNSTAKE_NODE_RESPONSE
>;

export type ProxyUnstakeNodeReq = UnstakeNodeCreator["ProxyReq"];
export type ExternalUnstakeNodeReq = UnstakeNodeCreator["ExternalReq"];
export type AppUnstakeNodeReq = UnstakeNodeCreator["AppReq"];
export type AnswerUnstakeNodeReq = UnstakeNodeCreator["AnswerReq"];
export type AnswerUnstakeNodeRes = UnstakeNodeCreator["AnswerRes"];
export type InternalUnstakeNodeRes = UnstakeNodeCreator["InternalRes"];
export type ProxyUnstakeNodeRes = UnstakeNodeCreator["ProxyRes"];

// Unjail Node

type UnjailNodeCreator = Creator<
  typeof UNJAIL_NODE_REQUEST,
  UnstakeNodeBody,
  typeof RequestUnjailNodeExists,
  typeof ANSWER_UNJAIL_NODE_REQUEST,
  typeof ANSWER_UNJAIL_NODE_RESPONSE,
  typeof UNJAIL_NODE_RESPONSE
>;

export type ProxyUnjailNodeReq = UnjailNodeCreator["ProxyReq"];
export type ExternalUnjailNodeReq = UnjailNodeCreator["ExternalReq"];
export type AppUnjailNodeReq = UnjailNodeCreator["AppReq"];
export type AnswerUnjailNodeReq = UnjailNodeCreator["AnswerReq"];
export type AnswerUnjailNodeRes = UnjailNodeCreator["AnswerRes"];
export type InternalUnjailNodeRes = UnjailNodeCreator["InternalRes"];
export type ProxyUnjailNodeRes = UnjailNodeCreator["ProxyRes"];

// Stake App

type StakeAppCreator = Creator<
  typeof STAKE_APP_REQUEST,
  StakeAppBody,
  typeof RequestStakeAppExists,
  typeof ANSWER_STAKE_APP_REQUEST,
  typeof ANSWER_STAKE_APP_RESPONSE,
  typeof STAKE_APP_RESPONSE
>;

export type ProxyStakeAppReq = StakeAppCreator["ProxyReq"];
export type ExternalStakeAppReq = StakeAppCreator["ExternalReq"];
export type AppStakeAppReq = StakeAppCreator["AppReq"];
export type AnswerStakeAppReq = StakeAppCreator["AnswerReq"];
export type AnswerStakeAppRes = StakeAppCreator["AnswerRes"];
export type InternalStakeAppRes = StakeAppCreator["InternalRes"];
export type ProxyStakeAppRes = StakeAppCreator["ProxyRes"];

// Transfer App

type TransferAppCreator = Creator<
  typeof TRANSFER_APP_REQUEST,
  TransferAppBody,
  typeof RequestTransferAppExists,
  typeof ANSWER_TRANSFER_APP_REQUEST,
  typeof ANSWER_TRANSFER_APP_RESPONSE,
  typeof TRANSFER_APP_RESPONSE
>;

export type ProxyTransferAppReq = TransferAppCreator["ProxyReq"];
export type ExternalTransferAppReq = TransferAppCreator["ExternalReq"];
export type AppTransferAppReq = TransferAppCreator["AppReq"];
export type AnswerTransferAppReq = TransferAppCreator["AnswerReq"];
export type AnswerTransferAppRes = TransferAppCreator["AnswerRes"];
export type InternalTransferAppRes = TransferAppCreator["InternalRes"];
export type ProxyTransferAppRes = TransferAppCreator["ProxyRes"];

// Unstake App

type UnstakeAppCreator = Creator<
  typeof UNSTAKE_APP_REQUEST,
  UnstakeAppBody,
  typeof RequestUnstakeAppExists,
  typeof ANSWER_UNSTAKE_APP_REQUEST,
  typeof ANSWER_UNSTAKE_APP_RESPONSE,
  typeof UNSTAKE_APP_RESPONSE
>;

export type ProxyUnstakeAppReq = UnstakeAppCreator["ProxyReq"];
export type ExternalUnstakeAppReq = UnstakeAppCreator["ExternalReq"];
export type AppUnstakeAppReq = UnstakeAppCreator["AppReq"];
export type AnswerUnstakeAppReq = UnstakeAppCreator["AnswerReq"];
export type AnswerUnstakeAppRes = UnstakeAppCreator["AnswerRes"];
export type InternalUnstakeAppRes = UnstakeAppCreator["InternalRes"];
export type ProxyUnstakeAppRes = UnstakeAppCreator["ProxyRes"];

// Change Param

type ChangeParamCreator = Creator<
  typeof CHANGE_PARAM_REQUEST,
  ChangeParamBody,
  typeof RequestChangeParamExists,
  typeof ANSWER_CHANGE_PARAM_REQUEST,
  typeof ANSWER_CHANGE_PARAM_RESPONSE,
  typeof CHANGE_PARAM_RESPONSE
>;

export type ProxyChangeParamReq = ChangeParamCreator["ProxyReq"];
export type ExternalChangeParamReq = ChangeParamCreator["ExternalReq"];
export type AppChangeParamReq = ChangeParamCreator["AppReq"];
export type AnswerChangeParamReq = ChangeParamCreator["AnswerReq"];
export type AnswerChangeParamRes = ChangeParamCreator["AnswerRes"];
export type InternalChangeParamRes = ChangeParamCreator["InternalRes"];
export type ProxyChangeParamRes = ChangeParamCreator["ProxyRes"];

// Dao Transfer

type DaoTransferCreator = Creator<
  typeof DAO_TRANSFER_REQUEST,
  DaoTransferBody,
  typeof RequestDaoTransferExists,
  typeof ANSWER_DAO_TRANSFER_REQUEST,
  typeof ANSWER_DAO_TRANSFER_RESPONSE,
  typeof DAO_TRANSFER_RESPONSE
>;

export type ProxyDaoTransferReq = DaoTransferCreator["ProxyReq"];
export type ExternalDaoTransferReq = DaoTransferCreator["ExternalReq"];
export type AppDaoTransferReq = DaoTransferCreator["AppReq"];
export type AnswerDaoTransferReq = DaoTransferCreator["AnswerReq"];
export type AnswerDaoTransferRes = DaoTransferCreator["AnswerRes"];
export type InternalDaoTransferRes = DaoTransferCreator["InternalRes"];
export type ProxyDaoTransferRes = DaoTransferCreator["ProxyRes"];

// Upgrade

type UpgradeCreator = Creator<
  typeof UPGRADE_REQUEST,
  UpgradeBody,
  typeof RequestUpgradeExists,
  typeof ANSWER_UPGRADE_REQUEST,
  typeof ANSWER_UPGRADE_RESPONSE,
  typeof UPGRADE_RESPONSE
>;

export type ProxyUpgradeReq = UpgradeCreator["ProxyReq"];
export type ExternalUpgradeReq = UpgradeCreator["ExternalReq"];
export type AppUpgradeReq = UpgradeCreator["AppReq"];
export type AnswerUpgradeReq = UpgradeCreator["AnswerReq"];
export type AnswerUpgradeRes = UpgradeCreator["AnswerRes"];
export type InternalUpgradeRes = UpgradeCreator["InternalRes"];
export type ProxyUpgradeRes = UpgradeCreator["ProxyRes"];

export type AnswerPoktTxRequests =
  | AnswerDaoTransferReq
  | AnswerChangeParamReq
  | AnswerStakeAppReq
  | AnswerUnjailNodeReq
  | AnswerUnstakeNodeReq
  | AnswerStakeNodeReq
  | AnswerUnstakeAppReq
  | AnswerTransferAppReq
  | AnswerUpgradeReq;

export type PoktTxRequest =
  | AppStakeNodeReq
  | AppUnstakeNodeReq
  | AppUnjailNodeReq
  | AppStakeAppReq
  | AppTransferAppReq
  | AppUnstakeAppReq
  | AppChangeParamReq
  | AppDaoTransferReq
  | AppUpgradeReq;

export type AnswerValidatePoktTxReq = {
  type: typeof ANSWER_VALIDATE_POKT_TX_REQUEST;
  data: {
    request: PoktTxRequest;
  };
};

export type AnswerValidatePoktTxRes = {
  type: typeof ANSWER_VALIDATE_POKT_TX_RESPONSE;
  data: {
    answered: boolean;
    result: ValidateTransactionResult;
  };
  error: null | typeof UnknownError;
};

// SignTransaction

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
  transaction: StakeNodeBody & { nodeAddress?: string };
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

export interface Coin {
  denom: string;
  amount: string;
}

export interface SupplierServiceConfig {
  serviceId: string;
  endpoints: SupplierEndpoint[];
  revShare: ServiceRevenueShare[];
}

export interface ServiceRevenueShare {
  address: string;
  revSharePercentage: number;
}

export interface SupplierEndpoint {
  url: string;
  rpcType: RPCType;
  configs: ConfigOption[];
}

export interface ConfigOption {
  key: ConfigOptions;
  value: string;
}

export enum ConfigOptions {
  UNKNOWN_CONFIG = 0,
  TIMEOUT = 1,
  UNRECOGNIZED = -1,
}

export enum RPCType {
  UNKNOWN_RPC = 0,
  GRPC = 1,
  WEBSOCKET = 2,
  JSON_RPC = 3,
  REST = 4,
  UNRECOGNIZED = -1,
}

export interface MsgStakeSupplier {
  typeUrl: "/pocket.supplier.MsgStakeSupplier";
  body: {
    ownerAddress: string;
    operatorAddress: string;
    stakeAmount: string;
    services: SupplierServiceConfig[];
  };
}

interface MsgSend {
  typeUrl: "/cosmos.bank.v1beta1.MsgSend";
  body: {
    toAddress: string;
    amount: string;
  };
}

interface MsgUnstakeSupplier {
  typeUrl: "/pocket.supplier.MsgUnstakeSupplier";
  body: {
    operatorAddress: string;
  };
}

export interface MsgClaimMorseSupplier {
  typeUrl: "/pocket.migration.MsgClaimMorseSupplier";
  body: {
    shannonOwnerAddress: string;
    shannonOperatorAddress: string;
    morsePublicKey: string;
    morseSignature: string;
    services: SupplierServiceConfig[];
  };
}

type ShannonMessages =
  | MsgSend
  | MsgStakeSupplier
  | MsgUnstakeSupplier
  | MsgClaimMorseSupplier;

export type SignTransactionBodyShannon = {
  address: string;
  memo?: string;
  id?: string;
  messages: Array<ShannonMessages>;
  protocol: SupportedProtocols.Cosmos;
};

type SignTransactionBody = (
  | SignAppStakeBody
  | SignAppTransferBody
  | SignAppUnstakeBody
  | SignGovChangeParamBody
  | SignGovDAOTransferBody
  | SignGovUpgradeBody
  | SignNodeStakeBody
  | SignNodeUnjailBody
  | SignNodeUnstakeBody
  | SignSendBody
) & { id?: string; protocol: SupportedProtocols.Pocket };

type BulkSignTransactionCreator = Creator<
  typeof BULK_SIGN_TRANSACTION_REQUEST,
  { transactions: Array<SignTransactionBody | SignTransactionBodyShannon> },
  typeof RequestSignTransactionExists,
  typeof ANSWER_BULK_SIGN_TRANSACTION_REQUEST,
  typeof ANSWER_BULK_SIGN_TRANSACTION_RESPONSE,
  typeof BULK_SIGN_TRANSACTION_RESPONSE,
  "data",
  {
    signatures: Array<{
      id?: string;
      signature: string;
      transactionHex: string;
      rawTx?: string;
      fee?: string;
    }>;
  }
>;

export type ProxyBulkSignTransactionReq =
  | BulkSignTransactionCreator["ProxyReq"]
  | (Omit<BulkSignTransactionCreator["ProxyReq"], "type"> & {
      type: typeof SIGN_TRANSACTION_REQUEST;
    });
export type ExternalBulkSignTransactionReq =
  BulkSignTransactionCreator["ExternalReq"];
export type ExternalBulkSignTransactionRes =
  BulkSignTransactionCreator["ExternalRes"];
export type AppBulkSignTransactionReq = BulkSignTransactionCreator["AppReq"];
export type AnswerBulkSignTransactionReq =
  BulkSignTransactionCreator["AnswerReq"];
export type AnswerBulkSignTransactionRes =
  BulkSignTransactionCreator["AnswerRes"];
export type InternalBulkSignTransactionRes =
  BulkSignTransactionCreator["InternalRes"];
export type ProxyBulkSignTransactionRes =
  BulkSignTransactionCreator["ProxyRes"];
