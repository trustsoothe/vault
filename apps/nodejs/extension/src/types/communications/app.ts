import type {
  EthereumNetworkFee,
  PocketNetworkFee,
  SupportedProtocols,
  CosmosFee,
} from "@soothe/vault";
import type { IAsset } from "../../redux/slices/app";
import type { BaseResponse, UnknownErrorType } from "./common";
import {
  NETWORK_FEE_REQUEST,
  NETWORK_FEE_RESPONSE,
  SET_REQUIRE_PASSWORD_FOR_OPTS_REQUEST,
  SET_REQUIRE_PASSWORD_FOR_OPTS_RESPONSE,
} from "../../constants/communication";

export interface NetworkFeeReq {
  type: typeof NETWORK_FEE_REQUEST;
  data: {
    toAddress?: string;
    asset?: IAsset;
    protocol: SupportedProtocols;
    chainId: string;
    data?: string;
    from?: string;
    gasLimit?: number;
    maxFeePerGas?: string;
    maxPriorityFeePerGas?: string;
    defaultGasPrice?: number;
    defaultGasAdjustmentFactor?: number;
    defaultGasEstimation?: number;
  };
}

export interface NetworkFeeRes {
  type: typeof NETWORK_FEE_RESPONSE;
  data: {
    answered: true;
    networkFee: PocketNetworkFee | EthereumNetworkFee | CosmosFee;
  } | null;
  error: UnknownErrorType | null;
}

export interface SetRequirePasswordForOptsReq {
  type: typeof SET_REQUIRE_PASSWORD_FOR_OPTS_REQUEST;
  data: {
    vaultPassword: string;
    enabled: boolean;
  };
}

export type SetRequirePasswordForOptsRes = BaseResponse<
  typeof SET_REQUIRE_PASSWORD_FOR_OPTS_RESPONSE,
  {
    isPasswordWrong: boolean;
    answered: true;
  }
>;
