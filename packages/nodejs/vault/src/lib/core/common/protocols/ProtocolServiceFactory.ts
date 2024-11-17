import {SupportedProtocols} from "../values";
import {PocketNetworkProtocolService} from "./PocketNetwork";
import {IEncryptionService} from "../encryption/IEncryptionService";
import {EthereumNetworkProtocolService} from "./EthereumNetwork";
import {PocketNetworkShannonProtocolService} from "./PocketNetworkShannon";

export class ProtocolServiceFactory {
  static getProtocolService<T extends SupportedProtocols>(protocol: T, encryptionService: IEncryptionService) {
    switch (protocol) {
      case SupportedProtocols.Pocket:
        return new PocketNetworkProtocolService(encryptionService)
      case SupportedProtocols.Ethereum:
        return new EthereumNetworkProtocolService(encryptionService)
      case SupportedProtocols.PocketShannon:
        return new PocketNetworkShannonProtocolService(encryptionService)
      default:
        throw new Error(`Protocol ${protocol} not supported`)
    }
  }
}
