import {SupportedProtocols} from "../values";
import {PocketNetworkProtocolService} from "./PocketNetwork";
import {IEncryptionService} from "../encryption/IEncryptionService";
import {EthereumNetworkProtocolService} from "./EthereumNetwork";
import {IProtocolService} from "./IProtocolService";

export class ProtocolServiceFactory {
  static getProtocolService<T extends SupportedProtocols>(protocol: T, encryptionService: IEncryptionService) {
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
