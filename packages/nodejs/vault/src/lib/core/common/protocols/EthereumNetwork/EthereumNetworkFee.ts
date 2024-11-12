import {IAbstractProtocolFee} from "../ProtocolFee";
import {SupportedProtocols} from "../../values";

export interface FeeTier {
  suggestedMaxFeePerGas: number;
  suggestedMaxPriorityFeePerGas?: number;
  amount: string;
}

export interface EthereumNetworkFee extends IAbstractProtocolFee<SupportedProtocols.Ethereum> {
  low: FeeTier;
  medium: FeeTier;
  high: FeeTier;
  site?: {
    suggestedMaxFeePerGas: number;
    suggestedMaxPriorityFeePerGas: number;
    amount: string;
  };
  baseFee?: string;
  estimatedGas: number;
}
