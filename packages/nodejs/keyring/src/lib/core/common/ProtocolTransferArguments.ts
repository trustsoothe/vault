import {IProtocolTransferArguments} from "./IProtocolTransferArguments";
import {PocketNetworkProtocol, UnspecifiedProtocol} from "./protocols";

export type ProtocolTransferArguments =
    IProtocolTransferArguments<UnspecifiedProtocol>
  | IProtocolTransferArguments<PocketNetworkProtocol>
