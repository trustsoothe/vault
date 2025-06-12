import {SupportedProtocols} from "../values";

export interface INetwork {
  protocol: SupportedProtocols;
  chainID: string;
  rpcUrl: string;
  defaultGasPrice?: number;
  defaultGasAdjustmentFactor?: number;
  defaultGasEstimation?: number;
}
