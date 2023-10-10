import {ChainID, IProtocol} from "../../IProtocol";
import {SupportedProtocols} from "../../values";

export class EthereumNetworkProtocol implements IProtocol<SupportedProtocols.Ethereum> {
  private static readonly chainIDs: string[] = ['11155111', '5', '1']

  public readonly name = SupportedProtocols.Ethereum
  constructor(public readonly chainID: ChainID<SupportedProtocols.Ethereum>) {
    if (!chainID || !EthereumNetworkProtocol.chainIDs.includes(chainID)) {
      throw new Error(`Chain ID cannot be null or empty and must be one of: ${EthereumNetworkProtocol.chainIDs.join(', ')}`)
    }
  }

  static isValidChainID(chainID: ChainID<SupportedProtocols.Ethereum>): boolean {
    return this.chainIDs.includes(chainID)
  }
}
