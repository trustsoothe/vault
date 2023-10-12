import {IProtocolTransferArguments} from "./IProtocolTransferArguments";
import {PocketNetworkProtocol, UnspecifiedProtocol} from "./index";

export type ProtocolTransferArguments =
    IProtocolTransferArguments<UnspecifiedProtocol>
  | IProtocolTransferArguments<PocketNetworkProtocol>
