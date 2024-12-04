import {PocketNetworkFee} from "./PocketNetwork";
import {EthereumNetworkFee} from "./EthereumNetwork";
import {SupportedProtocols} from "../values";
import {CosmosFee} from "./Cosmos/CosmosFee";

export interface IAbstractProtocolFee<T extends SupportedProtocols> {
  protocol: T;
}

export type ProtocolFee<SupportedProtocolTypes> =
  SupportedProtocolTypes extends SupportedProtocols.Pocket
     ? PocketNetworkFee
     : SupportedProtocolTypes extends SupportedProtocols.Ethereum
        ? EthereumNetworkFee
        : CosmosFee;
