import {IProtocol} from "../IProtocol";
import {SupportedProtocols} from "../values";

export class UnspecifiedProtocol implements IProtocol {
  public readonly name: SupportedProtocols = SupportedProtocols.Unspecified
  constructor(public readonly chainID: string) {
    if (!chainID) {
      throw new Error('Chain ID cannot be null or empty')
    }
  }
}
