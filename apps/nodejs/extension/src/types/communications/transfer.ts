import type { SupportedProtocols } from "@soothe/vault";
import type {
  TEthTransferBody,
  TPocketTransferBody,
} from "../../controllers/communication/Proxy";
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
import type { SendTransactionParams } from "../../redux/slices/vault/account";
import {
  OperationRejected,
  propertyIsNotValid,
  propertyIsRequired,
  RequestTimeout,
  RequestTransferExists,
  SessionIdNotPresented,
  UnauthorizedError,
  UnauthorizedErrorSessionInvalid,
  UnknownError,
} from "../../errors/communication";
import {
  ANSWER_TRANSFER_REQUEST,
  ANSWER_TRANSFER_RESPONSE,
  TRANSFER_REQUEST,
  TRANSFER_RESPONSE,
} from "../../constants/communication";
import type { TransactionStatus } from "../../controllers/datasource/Transaction";

export interface ProxyTransferReq extends BaseProxyRequest {
  type: typeof TRANSFER_REQUEST;
  data: TPocketTransferBody | TEthTransferBody;
}

export interface TransferRequestBody
  extends BaseExternalRequestBodyWithSession {
  transferData: (TPocketTransferBody | TEthTransferBody) & { chainId?: string };
}

export interface ExternalTransferReq {
  type: typeof TRANSFER_REQUEST;
  requestId: string;
  data: TransferRequestBody;
}

export type ExternalTransferErrors =
  | BaseErrors
  | typeof RequestTimeout
  | typeof SessionIdNotPresented
  | typeof UnauthorizedError
  | typeof UnauthorizedErrorSessionInvalid
  | typeof RequestTransferExists;

export type ExternalTransferRes = void | {
  type: typeof TRANSFER_RESPONSE;
  requestId: string;
  data: null;
  error: ExternalTransferErrors;
};

export interface InternalTransferRes {
  type: typeof TRANSFER_RESPONSE;
  requestId: string;
  data: {
    rejected: boolean;
    hash: string | null;
    protocol: SupportedProtocols | null;
  };
  error: null | typeof UnknownError | typeof OperationRejected;
}

export type ExternalTransferResToProxy =
  | Extract<ExternalTransferRes, { data: null }>
  | RequestBeingHandledRes;

export type TransferResponseFromBack =
  | Extract<ExternalTransferRes, { data: null }>
  | InternalTransferRes;

export interface ProxyValidTransferRes extends BaseProxyResponse {
  type: typeof TRANSFER_RESPONSE;
  data: string;
  error: null;
}

export type ProxyTransferError =
  | ExternalTransferErrors
  | typeof OperationRejected
  | ReturnType<typeof propertyIsRequired>
  | ReturnType<typeof propertyIsNotValid>
  | null;

export interface ProxyErrTransferRes extends BaseProxyResponse {
  type: typeof TRANSFER_RESPONSE;
  data: null;
  error: ProxyTransferError;
}

export type ProxyTransferRes = ProxyValidTransferRes | ProxyErrTransferRes;

export type AppTransferReq = BaseExternalRequestWithSession<
  typeof TRANSFER_REQUEST
> &
  TransferRequestBody;

export interface AnswerTransferReq {
  type: typeof ANSWER_TRANSFER_REQUEST;
  data: {
    rejected?: boolean;
    transferData: SendTransactionParams | null;
    request?: {
      tabId: number;
      origin: string;
      requestId: string;
      protocol: SupportedProtocols;
    } | null;
  };
}

type AnswerTransferResponseData = BaseData & {
  hash: string;
  isPasswordWrong?: boolean;
  details?: object;
  status: TransactionStatus;
};

export type AnswerTransferRes = BaseResponse<
  typeof ANSWER_TRANSFER_RESPONSE,
  AnswerTransferResponseData
>;
