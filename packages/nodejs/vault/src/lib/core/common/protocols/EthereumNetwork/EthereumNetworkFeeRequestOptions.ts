import { IAbstractProtocolFeeRequestOptions } from "../ProtocolFeeRequestOptions";
import { SupportedProtocols } from "../../values";
import { IAsset } from "../IAsset";

export interface EthereumNetworkFeeRequestOptions
  extends IAbstractProtocolFeeRequestOptions<SupportedProtocols.Ethereum> {
  from?: string;
  to: string;
  value?: string;
  data?: string;
  gasLimit?: number;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  asset?: IAsset;
}
