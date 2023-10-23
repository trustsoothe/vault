import {IAbstractProtocolFee} from "../ProtocolFee";
import {SupportedProtocols} from "../../values";

export interface EthereumNetworkFee extends IAbstractProtocolFee<SupportedProtocols.Ethereum> {
  low: {
    suggestedMaxFeePerGas: number;
    suggestedMaxPriorityFeePerGas: number;
    amount: number;
  };
  medium: {
    suggestedMaxFeePerGas: number;
    suggestedMaxPriorityFeePerGas: number;
    amount: number;
  };
  high: {
    suggestedMaxFeePerGas: number;
    suggestedMaxPriorityFeePerGas: number;
    amount: number;
  };
}
