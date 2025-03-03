import {SupportedProtocols} from "../values";

export interface INetwork {
  protocol: SupportedProtocols;
  chainID: string;
  rpcUrl: string;
}
