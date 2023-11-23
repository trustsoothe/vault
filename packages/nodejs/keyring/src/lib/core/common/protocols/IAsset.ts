import {SupportedProtocols} from "../values";

export interface IAsset {
  protocol: SupportedProtocols
  chainID: string;
  /**
   * TODO: This might need to change as we integrate other protocols with native assets.
   */
  contractAddress: string;
  decimals: number;
}
