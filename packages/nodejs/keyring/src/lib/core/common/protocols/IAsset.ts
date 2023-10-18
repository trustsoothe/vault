import {SupportedProtocols} from "../values";

export interface IAsset {
  protocol: SupportedProtocols
  chainID: string;
  contractAddress?: string;
}
