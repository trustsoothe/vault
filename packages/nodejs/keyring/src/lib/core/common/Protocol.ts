import {SupportedProtocols} from "./values";
import {IProtocol} from "./IProtocol";

export type Protocol = IProtocol<SupportedProtocols.Pocket> | IProtocol<SupportedProtocols.Unspecified>
