import {setupServer} from 'msw/node';
import {INetwork, ProtocolNotSupported, SupportedProtocols} from '@poktscan/keyring';
import {
  successfulHandlersFactory as pnSuccessfulHandlers,
  failureHandlerFactory as pnFailureHandlers
} from './pocket-network'

import {
  successfulHandlersFactory as ethSuccessfulHandlers,
  failureHandlerFactory as ethFailureHandlers
} from './ethereum-network'

export class MockServerFactory  {
  static getSuccessMockServer(network: INetwork){
    switch (network.protocol) {
      case SupportedProtocols.Pocket:
        return setupServer(...pnSuccessfulHandlers(network.rpcUrl));
      case SupportedProtocols.Ethereum:
        return setupServer(...ethSuccessfulHandlers(network.rpcUrl));
      default:
        throw new ProtocolNotSupported(network.protocol)
    }
  }

  static getFailureMockServer(network: INetwork){
    switch (network.protocol) {
      case SupportedProtocols.Pocket:
        return setupServer(...pnFailureHandlers(network.rpcUrl));
      case SupportedProtocols.Ethereum:
        return setupServer(...ethFailureHandlers(network.rpcUrl));
      default:
        throw new ProtocolNotSupported(network.protocol)
    }
  }
}
