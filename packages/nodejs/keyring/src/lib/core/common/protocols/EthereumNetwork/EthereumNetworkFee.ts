import {IAbstractProtocolFee} from "../ProtocolFee";
import {SupportedProtocols} from "../../values";

export interface EthereumNetworkFee extends IAbstractProtocolFee<SupportedProtocols.Ethereum> {
  low: {
    suggestedMaxFeePerGas: number;
    suggestedMaxPriorityFeePerGas: number;
    amount: string;
  };
  medium: {
    suggestedMaxFeePerGas: number;
    suggestedMaxPriorityFeePerGas: number;
    amount: string;
  };
  high: {
    suggestedMaxFeePerGas: number;
    suggestedMaxPriorityFeePerGas: number;
    amount: string;
  };
  baseFee: string;
  estimatedGas: number;
}
