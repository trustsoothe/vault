import {SupportedProtocols} from "../values";
import {PocketNetworkProtocolTransaction} from "./PocketNetwork/PocketNetworkProtocolTransaction";
import {EthereumNetworkProtocolTransaction} from "./EthereumNetwork/EthereumNetworkProtocolTransaction";


type StandardEnum<T = string> = {
  [id: string]: T | string;
  [nu: number]: string;
}

export interface IAbstractProtocolTransaction<T extends SupportedProtocols, TTransactionTypes extends StandardEnum<string>> {
  protocol: T;
  transactionType: TTransactionTypes[keyof TTransactionTypes];
  from: string;
  to: string;
  amount: string;
  privateKey: string;
  skipValidation?: boolean;
}

type AllowedProtocols = keyof typeof SupportedProtocols;

export interface IProtocolTransactionResult<T extends AllowedProtocols> {
  protocol: T;
  transactionHash: string;
}

export type ProtocolTransaction<T extends SupportedProtocols> =
  T extends SupportedProtocols.Pocket
    ? PocketNetworkProtocolTransaction
    : EthereumNetworkProtocolTransaction;
