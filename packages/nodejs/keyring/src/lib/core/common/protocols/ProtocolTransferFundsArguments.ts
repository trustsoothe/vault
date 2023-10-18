import {SupportedProtocols} from "../values";
import {PocketNetworkTransferFundsArguments} from "./PocketNetwork";
import {EthereumNetworkTransferFundsArguments} from "./EthereumNetwork";
import {UnspecifiedProtocolTransferFundsArguments} from "./Unspecified/UnspecifiedProtocolTransferFundsArguments";

export interface IAbstractTransferFundsArguments<SupportedProtocolTypes> {
  protocol: SupportedProtocolTypes
}

export type ProtocolTransferFundsArguments<SupportedProtocolTypes> =
  SupportedProtocolTypes extends SupportedProtocols.Pocket
      ? PocketNetworkTransferFundsArguments
      : SupportedProtocolTypes extends SupportedProtocols.Ethereum
        ? EthereumNetworkTransferFundsArguments
        :  UnspecifiedProtocolTransferFundsArguments;
