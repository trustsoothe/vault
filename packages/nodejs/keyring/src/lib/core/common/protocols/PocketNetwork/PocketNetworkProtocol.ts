import {IProtocol} from "../../IProtocol";
import {SupportedProtocols} from "../../values";

export class PocketNetworkProtocol implements IProtocol {
  public readonly name: SupportedProtocols = SupportedProtocols.Pocket
  constructor(public readonly chainID: 'mainnet' | 'testnet' | string) {
    if (!chainID || ['mainnet', 'testnet'].includes(chainID) === false) {
      throw new Error('Chain ID cannot be null or empty and must be either mainnet or testnet')
    }
  }
}
