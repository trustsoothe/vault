import {ChainID, IProtocol} from "../IProtocol";
import {SupportedProtocols} from "../../values";

export class UnspecifiedProtocol implements IProtocol<SupportedProtocols.Unspecified> {
  public readonly name = SupportedProtocols.Unspecified
  constructor(public readonly chainID: ChainID<SupportedProtocols.Unspecified>) {
    if (!chainID) {
      throw new Error('Chain ID cannot be null or empty')
    }
  }
}
