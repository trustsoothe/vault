import {setupServer} from 'msw/node';
import {Network, ProtocolNotSupported, SupportedProtocols} from '@poktscan/keyring';
import protocolHandlersFactory from './pocket-network'

export class MockServerFactory  {
  static getMockServer(network: Network){
    switch (network.protocol.name) {
      case SupportedProtocols.Pocket:
        return setupServer(...protocolHandlersFactory(network.rpcUrl));
      default:
        throw new ProtocolNotSupported(network.protocol.name)
    }
  }
}
