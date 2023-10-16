import {SupportedProtocols} from "../common/values";
import {ChainID} from "../common/protocols/ChainID";

export interface INetworkOptions<T extends SupportedProtocols> {
  name: string
  rpcUrl: string
  protocol: SupportedProtocols
  chainID: ChainID<T>
  isDefault?: boolean
  isPreferred?: boolean
}
