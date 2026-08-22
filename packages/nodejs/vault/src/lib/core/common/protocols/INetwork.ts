import {SupportedProtocols} from "../values";

export interface INetwork {
  protocol: SupportedProtocols;
  chainID: string;
  rpcUrl: string;
  defaultGasUsed?: 'auto' | number;
  defaultGasPrice?: number;
  defaultGasAdjustment?: number;
  defaultGasEstimation?: number;
  /**
   * Cosmos only: sign transactions as unordered (no account sequence).
   * Defaults to true when not set; a transaction can still override it.
   */
  unorderedTransactions?: boolean;
}
