import {SupportedProtocols} from "../values";

export type PocketNetworkChainIDList = 'mainnet' | 'testnet';
export type EthereumChainIDList = '11155111' | '5' | '1';
export type UnspecifiedChainIDList = 'unspecified';

export type ChainID<SupportedProtocolTypes> =
  SupportedProtocolTypes extends SupportedProtocols.Pocket
      ? PocketNetworkChainIDList
      : SupportedProtocolTypes extends SupportedProtocols.Ethereum
        ? EthereumChainIDList
        : UnspecifiedChainIDList;
