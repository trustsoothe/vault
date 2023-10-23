import {IAbstractProtocolFee} from "../ProtocolFee";
import {SupportedProtocols} from "../../values";

export interface EthereumNetworkFee extends IAbstractProtocolFee<SupportedProtocols.Ethereum> {
  low: {
    suggestedMaxFeePerGas: bigint;
    suggestedMaxPriorityFeePerGas: bigint;
    amount: bigint;
  };
  medium: {
    suggestedMaxFeePerGas: bigint;
    suggestedMaxPriorityFeePerGas: bigint;
    amount: bigint;
  };
  high: {
    suggestedMaxFeePerGas: bigint;
    suggestedMaxPriorityFeePerGas: bigint;
    amount: bigint;
  };
}
