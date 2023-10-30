import {SupportedProtocols} from "../../values";
import {IAbstractProtocolTransaction} from "../ProtocolTransaction";
import {EthereumNetworkTransactionTypes} from "./EthereumNetworkTransactionTypes";

export interface EthereumNetworkProtocolTransaction extends IAbstractProtocolTransaction<SupportedProtocols.Ethereum, typeof EthereumNetworkTransactionTypes> {
  protocol: SupportedProtocols.Ethereum;
  transactionType: EthereumNetworkTransactionTypes;
  maxFeePerGas: number;
  maxPriorityFeePerGas: number;
  data?: string;
}
