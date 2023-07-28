import {setupServer} from 'msw/node';
import {Network, ProtocolNotSupported, SupportedProtocols} from '@poktscan/keyring';
import {successfulHandlersFactory, failureHandlerFactory} from './pocket-network'

export class MockServerFactory  {
  static getSuccessMockServer(network: Network){
    switch (network.protocol.name) {
      case SupportedProtocols.Pocket:
        return setupServer(...successfulHandlersFactory(network.rpcUrl));
      default:
        throw new ProtocolNotSupported(network.protocol.name)
    }
  }

  static getFailureMockServer(network: Network){
    switch (network.protocol.name) {
      case SupportedProtocols.Pocket:
        return setupServer(...failureHandlerFactory(network.rpcUrl));
      default:
        throw new ProtocolNotSupported(network.protocol.name)
    }
  }
}
