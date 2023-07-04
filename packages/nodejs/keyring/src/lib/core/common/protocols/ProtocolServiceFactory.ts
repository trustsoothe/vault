import {SupportedProtocols} from "../values";
import {PocketNetworkProtocolService} from "./PocketNetwork/PocketNetworkProtocolService";
import IEncryptionService from "../encryption/IEncryptionService";

export class ProtocolServiceFactory {
  static getProtocolService(protocol: SupportedProtocols, encryptionService: IEncryptionService) {
    switch (protocol) {
      case SupportedProtocols.POCKET_NETWORK:
        return new PocketNetworkProtocolService(encryptionService)
      default:
        throw new Error(`Protocol ${protocol} not supported`)
    }
  }
}
