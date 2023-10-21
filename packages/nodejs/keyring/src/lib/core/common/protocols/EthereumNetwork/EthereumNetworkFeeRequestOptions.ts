import {IAbstractProtocolFeeRequestOptions} from "../ProtocolFeeRequestOptions";
import {SupportedProtocols} from "../../values";

export interface EthereumNetworkFeeRequestOptions extends IAbstractProtocolFeeRequestOptions<SupportedProtocols.Ethereum> {
  from?: string;
  to: string;
  value?: string;
  data?: string;
}
