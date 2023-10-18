import {PocketNetworkFee} from "./PocketNetwork/PocketNetworkFee";
import {EthereumNetworkFee} from "./EthereumNetwork/EthereumNetworkFee";
import {SupportedProtocols} from "../values";

export interface IAbstractProtocolFee<T extends SupportedProtocols> {
  protocol: T;
}

export type ProtocolFee<T extends SupportedProtocols> =
   T extends SupportedProtocols.Pocket
     ? PocketNetworkFee
     : T extends SupportedProtocols.Ethereum
        ? EthereumNetworkFee
        : never;
