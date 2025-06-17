import {SupportedProtocols} from "../values";

export interface INetwork {
  protocol: SupportedProtocols;
  chainID: string;
  rpcUrl: string;
  defaultGasUsed?: 'auto' | number;
  defaultGasPrice?: number;
  defaultGasAdjustment?: number;
  defaultGasEstimation?: number;
}
