import {IAbstractProtocolFee} from "../ProtocolFee";
import {SupportedProtocols} from "../../values";

export interface EthereumNetworkFee extends IAbstractProtocolFee<SupportedProtocols.Ethereum> {
  gasPrice: bigint;
  gasLimit: bigint;
  suggestedLow: bigint;
  suggestedMedium: bigint;
  suggestedHigh: bigint;
}
