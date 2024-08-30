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
  CHANGE_PARAM_REQUEST,
  CHANGE_PARAM_RESPONSE,
  DAO_TRANSFER_REQUEST,
  DAO_TRANSFER_RESPONSE,
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
} from "../../constants/communication";
import {
  ChangeParamBody,
  DaoTransferBody,
  StakeAppBody,
  StakeNodeBody,
  TransferAppBody,
  UnstakeAppBody,
  UnstakeNodeBody,
} from "../../controllers/communication/Proxy";
import {
  OperationRejected,
  propertyIsNotValid,
  propertyIsRequired,
  RequestChangeParamExists,
  RequestDaoTransferExists,
  RequestStakeAppExists,
  RequestStakeNodeExists,
  RequestTimeout,
  RequestTransferAppExists,
  RequestUnjailNodeExists,
  RequestUnstakeAppExists,
  RequestUnstakeNodeExists,
  SessionIdNotPresented,
  UnauthorizedError,
  UnauthorizedErrorSessionInvalid,
  UnknownError,
} from "../../errors/communication";
import type { SupportedProtocols } from "@poktscan/vault";

export type ExternalBasePoktTxErrors =
  | BaseErrors
  | typeof RequestTimeout
  | typeof SessionIdNotPresented
  | typeof UnauthorizedError
  | typeof UnauthorizedErrorSessionInvalid;

export type AnswerBasePoktTxResponseData = BaseData & {
  hash: string;
  isPasswordWrong?: boolean;
};

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

export interface InternalResponse<T extends string> {
  type: T;
  requestId: string;
  data: {
    rejected: boolean;
    hash: string | null;
    protocol: SupportedProtocols | null;
  };
  error: null | typeof UnknownError | typeof OperationRejected;
}

export type ProxyPoktTxRes<T extends string> =
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
      data: {
        hash: string;
      };
      error: null;
    });

export type AnswerBasePoktTxReq<T extends string, TBody> = {
  type: T;
  data: {
    rejected?: boolean;
    transactionData: TBody & { chainId?: string };
    vaultPassword?: string;
    fee: number;
    request?: {
      tabId: number;
      origin: string;
      requestId: string;
      protocol: SupportedProtocols;
    } | null;
  };
};

type Creator<
  TReq extends string,
  TBody,
  TErrorExists extends BaseError,
  TInReq extends string,
  TInRes extends string,
  TRes extends string
> = {
  ProxyReq: BaseProxyRequest & {
    type: TReq;
    data: TBody;
  };
  ExternalReq: {
    type: TReq;
    requestId: string;
    data: BaseExternalRequestBodyWithSession & {
      transactionData: TBody;
    };
  };
  AppReq: BaseExternalRequestWithSession<TReq> & {
    transactionData: TBody & { chainId: string };
  };
  ExternalRes: ExternalResponse<TRes, TErrorExists>;
  AnswerReq: AnswerBasePoktTxReq<TInReq, TBody>;
  AnswerRes: BaseResponse<TInRes, AnswerBasePoktTxResponseData>;
  InternalRes: InternalResponse<TRes>;
  ExternalResToProxy:
    | Extract<ExternalResponse<TRes, BaseError>, { data: null }>
    | RequestBeingHandledRes;
  ResponseFromBack:
    | Extract<ExternalResponse<TRes, TErrorExists>, { data: null }>
    | InternalResponse<TRes>;
  ProxyRes: ProxyPoktTxRes<TRes>;
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

export type AnswerPoktTxRequests =
  | AnswerDaoTransferReq
  | AnswerChangeParamReq
  | AnswerStakeAppReq
  | AnswerUnjailNodeReq
  | AnswerUnstakeNodeReq
  | AnswerStakeNodeReq
  | AnswerUnstakeAppReq
  | AnswerTransferAppReq;
