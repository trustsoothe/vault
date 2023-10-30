import {SupportedProtocols} from "../values";
import {PocketNetworkTransferFundsArguments} from "./PocketNetwork";
import {EthereumNetworkTransferFundsArguments} from "./EthereumNetwork";
import {UnspecifiedProtocolTransferFundsArguments} from "./Unspecified/UnspecifiedProtocolTransferFundsArguments";

export interface IAbstractTransferFundsArguments<T extends SupportedProtocols> {
  protocol: T
}

export type ProtocolTransferFundsArguments<T extends SupportedProtocols> =
  T extends SupportedProtocols.Pocket
      ? PocketNetworkTransferFundsArguments
      : T extends SupportedProtocols.Ethereum
        ? EthereumNetworkTransferFundsArguments
        :  UnspecifiedProtocolTransferFundsArguments;
