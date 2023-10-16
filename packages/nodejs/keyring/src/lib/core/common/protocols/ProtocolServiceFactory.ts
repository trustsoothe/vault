import {SupportedProtocols} from "../values";
import {PocketNetworkProtocolService} from "./PocketNetwork";
import {IEncryptionService} from "../encryption/IEncryptionService";
import {EthereumNetworkProtocolService} from "./EthereumNetwork";

export class ProtocolServiceFactory {
  static getProtocolService(protocol: SupportedProtocols, encryptionService: IEncryptionService) {
    switch (protocol) {
      case SupportedProtocols.Pocket:
        return new PocketNetworkProtocolService(encryptionService)
      case SupportedProtocols.Ethereum:
        return new EthereumNetworkProtocolService(encryptionService)
      default:
        throw new Error(`Protocol ${protocol} not supported`)
    }
  }
}
