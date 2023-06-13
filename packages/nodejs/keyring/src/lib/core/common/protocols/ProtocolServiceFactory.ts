import {SupportedProtocols} from "../values";
import {PocketNetworkProtocolService} from "./PocketNetworkProtocolService";

export class ProtocolServiceFactory {
  static getProtocolService(protocol: SupportedProtocols) {
    switch (protocol) {
      case SupportedProtocols.POCKET_NETWORK:
        return new PocketNetworkProtocolService()
      default:
        throw new Error(`Protocol ${protocol} not supported`)
    }
  }
}
