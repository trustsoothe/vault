import IEntity from "../common/IEntity";
import {SupportedProtocols} from "../common/values";

export interface IAbstractNetwork extends IEntity {
  protocol: SupportedProtocols
  rpcUrl: string
}
