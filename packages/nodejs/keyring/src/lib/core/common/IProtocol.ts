import {SupportedProtocols} from "./values";

export type PocketNetworkChainIDList = 'mainnet' | 'testnet';
export type EthereumChainIDList = '11155111' | '5' | '1';
export type UnspecifiedChainIDList = 'unspecified';

export type ChainID<T extends SupportedProtocols> =
    T extends SupportedProtocols.Pocket
      ? PocketNetworkChainIDList
      : T extends SupportedProtocols.Ethereum
        ? EthereumChainIDList
        : T extends SupportedProtocols.Unspecified
          ? UnspecifiedChainIDList
          : never;

export interface IProtocol<T extends SupportedProtocols> {
  name: T
  chainID: ChainID<T>
}
