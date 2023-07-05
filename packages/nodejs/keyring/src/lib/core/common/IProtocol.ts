import {SupportedProtocols} from "./values";

export type ChainID<T extends SupportedProtocols> =
    T extends SupportedProtocols.Pocket
      ? 'mainnet' | 'testnet'
      : T extends SupportedProtocols.Unspecified
        ? 'unspecified'
        : never;

export interface IProtocol<T extends SupportedProtocols> {
  name: T
  chainID: ChainID<T>
}
