import {ChainID, IProtocol} from "../../IProtocol";
import {SupportedProtocols} from "../../values";

export class PocketNetworkProtocol implements IProtocol<SupportedProtocols.Pocket> {
  public readonly name = SupportedProtocols.Pocket
  constructor(public readonly chainID: ChainID<SupportedProtocols.Pocket>) {
    if (!chainID || ['mainnet', 'testnet'].includes(chainID) === false) {
      throw new Error('Chain ID cannot be null or empty and must be either mainnet or testnet')
    }
  }

  static isValidChainID(chainID: ChainID<SupportedProtocols.Pocket>): boolean {
    return ['mainnet', 'testnet'].includes(chainID)
  }
}
