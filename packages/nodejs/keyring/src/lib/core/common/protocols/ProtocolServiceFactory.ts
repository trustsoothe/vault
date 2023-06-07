import {SupportedProtocols} from "../values";

export class ProtocolServiceFactory {
  static getProtocolService(protocol: SupportedProtocols) {
    switch (protocol) {
      case SupportedProtocols.POCKET_NETWORK:
        return null
      default:
        throw new Error(`Protocol ${protocol} not supported`)
    }
  }
}
