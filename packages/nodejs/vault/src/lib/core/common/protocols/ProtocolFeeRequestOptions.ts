import {SupportedProtocols} from "../values";
import {PocketNetworkFeeRequestOptions} from "./PocketNetwork";
import {EthereumNetworkFeeRequestOptions} from "./EthereumNetwork";

export interface IAbstractProtocolFeeRequestOptions<T extends SupportedProtocols> {
  protocol: T;
}

export type ProtocolFeeRequestOptions<T extends SupportedProtocols> =
  T extends SupportedProtocols.Pocket
    ? PocketNetworkFeeRequestOptions
    : T extends SupportedProtocols.Ethereum
      ? EthereumNetworkFeeRequestOptions
      : {};

