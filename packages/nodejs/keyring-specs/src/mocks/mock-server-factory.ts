import {setupServer} from 'msw/node';
import {INetwork, ProtocolNotSupported, SupportedProtocols} from '@poktscan/keyring';
import {DefaultBodyType, MockedRequest, RestHandler} from "msw";
import {
  queryBalanceHandlerFactory as pocketQueryBalanceHandlerFactory,
  queryBalanceFailureHandlerFactory as pocketQueryBalanceFailureHandlerFactory,
  queryFeeHandlerFactory as pocketQueryFeeHandlerFactory,
  queryFeeFailureHandlerFactory as pocketQueryFeeFailureHandlerFactory,
  sendTransactionHandlerFactory as pocketSendTransactionHandlerFactory,
} from './pocket-network';

import {
  queryBalanceHandlerFactory as ethereumQueryBalanceHandlerFactory,
  queryBalanceFailureHandlerFactory as ethereumQueryBalanceFailureHandlerFactory,
  queryFeeFailureHandlerFactory as ethereumQueryFeeFailureHandlerFactory,
  queryFeeHandlerFactory as ethereumQueryFeeHandlerFactory,
  sendTransactionHandlerFactory as ethereumSendTransactionHandlerFactory,
} from './ethereum-network';

export class MockServerFactory  {
  private readonly _network: INetwork;
  private _handlers: RestHandler<MockedRequest<DefaultBodyType>>[] = []

  constructor(network: INetwork) {
    if (!network) throw new Error('network is required');
    this._network = network;
  }

  addSuccessfulQueryFeeHandler() {
    switch (this._network.protocol) {
      case SupportedProtocols.Pocket:
        this._handlers.push(...pocketQueryFeeHandlerFactory(this._network));
        return this;
      case SupportedProtocols.Ethereum:
        this._handlers.push(...ethereumQueryFeeHandlerFactory(this._network));
        return this;
      default:
        throw new ProtocolNotSupported(this._network.protocol);
    }
  }

  addSuccessfulQueryBalanceHandler() {
    switch (this._network.protocol) {
      case SupportedProtocols.Pocket:
        this._handlers.push(...pocketQueryBalanceHandlerFactory(this._network));
        return this;
      case SupportedProtocols.Ethereum:
        this._handlers.push(...ethereumQueryBalanceHandlerFactory(this._network));
        return this;
      default:
        throw new ProtocolNotSupported(this._network.protocol);
    }
  }

  addFailedQueryFeeHandler() {
    switch (this._network.protocol) {
      case SupportedProtocols.Pocket:
        this._handlers.push(...pocketQueryFeeFailureHandlerFactory(this._network));
        return this;
      case SupportedProtocols.Ethereum:
        this._handlers.push(...ethereumQueryFeeFailureHandlerFactory(this._network));
        return this;
      default:
        throw new ProtocolNotSupported(this._network.protocol);
    }
  }

  addFailedQueryBalanceHandler() {
    switch (this._network.protocol) {
      case SupportedProtocols.Pocket:
        this._handlers.push(...pocketQueryBalanceFailureHandlerFactory(this._network));
        return this;
      case SupportedProtocols.Ethereum:
        this._handlers.push(...ethereumQueryBalanceFailureHandlerFactory(this._network));
        return this;
      default:
        throw new ProtocolNotSupported(this._network.protocol);
    }
  }

  addSendTransactionHandler() {
    switch (this._network.protocol) {
      case SupportedProtocols.Pocket:
        this._handlers.push(...pocketSendTransactionHandlerFactory(this._network));
        return this;
      case SupportedProtocols.Ethereum:
        this._handlers.push(...ethereumSendTransactionHandlerFactory(this._network));
        return this;
      default:
        throw new ProtocolNotSupported(this._network.protocol);
    }
  }

  buildServer() {
    if (this._handlers.length === 0) throw new Error('No handlers were added to the mock server');
    return setupServer(...this._handlers);
  }
}
