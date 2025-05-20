import {IAbstractProtocolFee} from "../ProtocolFee";
import {SupportedProtocols} from "../../values";

export interface CosmosFee extends IAbstractProtocolFee<SupportedProtocols.Cosmos> {
  estimatedGas: number;
  gasAdjustmentUsed: number;
  value: number;
  gasPriceUsed: number;
}
