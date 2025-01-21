import {setupServer} from 'msw/node';
import {INetwork, ProtocolNotSupported, SupportedProtocols} from '@poktscan/vault';
import {DefaultBodyType, MockedRequest, RestHandler} from "msw";
import {
  queryBalanceHandlerFactory as pocketQueryBalanceHandlerFactory,
  queryBalanceFailureHandlerFactory as pocketQueryBalanceFailureHandlerFactory,
  queryFeeHandlerFactory as pocketQueryFeeHandlerFactory,
  queryFeeFailureHandlerFactory as pocketQueryFeeFailureHandlerFactory,
  sendTransactionHandlerFactory as pocketSendTransactionHandlerFactory,
  queryNodeHandlerFactory as pocketQueryNodeHandlerFactory,
  queryNodeFailureHandlerFactory as pocketQueryNodeFailureHandlerFactory,
} from './pocket-network';

import {
  queryBalanceHandlerFactory as ethereumQueryBalanceHandlerFactory,
  queryBalanceFailureHandlerFactory as ethereumQueryBalanceFailureHandlerFactory,
  queryFeeFailureHandlerFactory as ethereumQueryFeeFailureHandlerFactory,
  queryFeeHandlerFactory as ethereumQueryFeeHandlerFactory,
  sendTransactionHandlerFactory as ethereumSendTransactionHandlerFactory,
  queryGasPriceHandler as ethereumQueryGasPriceHandler,
  queryGasPriceFailureHandler as ethereumQueryGasPriceFailureHandler,
  queryEstimateGasHandler as ethereumQueryEstimateGasHandler,
} from './ethereum-network';

import {
  queryBalanceHandlerFactory as pocketShannonQueryBalanceHandlerFactory,
  queryBalanceFailureHandlerFactory as pocketShannonQueryBalanceFailureHandlerFactory,
  sendTransactionHandlerFactory as pocketShannonSendTransactionHandlerFactory,
} from './cosmos';

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
      case SupportedProtocols.Cosmos:
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
      case SupportedProtocols.Cosmos:
        this._handlers.push(...pocketShannonQueryBalanceHandlerFactory(this._network));
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
      case SupportedProtocols.Cosmos:
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
      case SupportedProtocols.Cosmos:
        this._handlers.push(...pocketShannonQueryBalanceFailureHandlerFactory(this._network));
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
      case SupportedProtocols.Cosmos:
        this._handlers.push(...pocketShannonSendTransactionHandlerFactory(this._network));
        return this;
      default:
        throw new ProtocolNotSupported(this._network.protocol);
    }
  }

  addSuccessfulQueryNodeHandler() {
    switch (this._network.protocol) {
      case SupportedProtocols.Pocket:
        this._handlers.push(...pocketQueryNodeHandlerFactory(this._network));
        return this;
      case SupportedProtocols.Ethereum:
      default:
        throw new ProtocolNotSupported(this._network.protocol);
    }
  }

  addFailedQueryNodeHandler() {
      switch (this._network.protocol) {
        case SupportedProtocols.Pocket:
          this._handlers.push(...pocketQueryNodeFailureHandlerFactory(this._network));
          return this;
        case SupportedProtocols.Ethereum:
        default:
      }
  }

  addQueryGasPriceHandler() {
    switch (this._network.protocol) {
      case SupportedProtocols.Ethereum:
        this._handlers.push(...ethereumQueryGasPriceHandler(this._network));
        return this;
      default:
        throw new ProtocolNotSupported(this._network.protocol);
    }
  }

  addQueryGasPriceFailureHandler() {
    switch (this._network.protocol) {
      case SupportedProtocols.Ethereum:
        this._handlers.push(...ethereumQueryGasPriceFailureHandler(this._network));
        return this;
      default:
        throw new ProtocolNotSupported(this._network.protocol);
    }
  }

  addQueryEstimateGasHandler() {
    switch (this._network.protocol) {
      case SupportedProtocols.Ethereum:
        this._handlers.push(...ethereumQueryEstimateGasHandler(this._network));
        break;
      default:
        console.log(`Protocol not supported: Skipping adding query estimate gas handler for ${this._network.protocol}`);
    }

    return this;
  }

  buildServer() {
    if (this._handlers.length === 0) throw new Error('No handlers were added to the mock server');
    return setupServer(...this._handlers);
  }
}
