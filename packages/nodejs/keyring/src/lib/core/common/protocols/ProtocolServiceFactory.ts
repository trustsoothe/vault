import {SupportedProtocols} from "../values";
import {PocketNetworkProtocolService} from "./PocketNetwork";
import IEncryptionService from "../encryption/IEncryptionService";
import {Protocol} from "../Protocol";

export class ProtocolServiceFactory {
  static getProtocolService(protocol: Protocol, encryptionService: IEncryptionService) {
    switch (protocol.name) {
      case SupportedProtocols.Pocket:
        return new PocketNetworkProtocolService(encryptionService)
      default:
        throw new Error(`Protocol ${protocol} not supported`)
    }
  }
}
