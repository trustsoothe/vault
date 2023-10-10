import {setupServer} from 'msw/node';
import {Network, ProtocolNotSupported, SupportedProtocols} from '@poktscan/keyring';
import {
  successfulHandlersFactory as pnSuccessfulHandlers,
  failureHandlerFactory as pnFailureHandlers
} from './pocket-network'

import {
  successfulHandlersFactory as ethSuccessfulHandlers,
  failureHandlerFactory as ethFailureHandlers
} from './ethereum-network'

export class MockServerFactory  {
  static getSuccessMockServer(network: Network){
    switch (network.protocol.name) {
      case SupportedProtocols.Pocket:
        return setupServer(...pnSuccessfulHandlers(network.rpcUrl));
      case SupportedProtocols.Ethereum:
        return setupServer(...ethSuccessfulHandlers(network.rpcUrl));
      default:
        throw new ProtocolNotSupported(network.protocol.name)
    }
  }

  static getFailureMockServer(network: Network){
    switch (network.protocol.name) {
      case SupportedProtocols.Pocket:
        return setupServer(...pnFailureHandlers(network.rpcUrl));
      case SupportedProtocols.Ethereum:
        return setupServer(...ethFailureHandlers(network.rpcUrl));
      default:
        throw new ProtocolNotSupported(network.protocol.name)
    }
  }
}
