export * from './lib/VaultTeller'
export * from './lib/core/common/values'
export * from './lib/core/vault'
export * from './lib/core/session'
export * from './lib/core/network'
export * from './lib/core/asset'
export * from './lib/core/common/permissions'
export * from './lib/core/common/protocols'
export * from './lib/core/common/storage/AssetStorage'
export * from './lib/core/common/storage/NetworkStorage'
export * from './lib/errors'

import EncryptionServiceSpecFactory from './lib/core/common/encryption/IEncryptionService.specFactory'

import type {IEncryptionService} from './lib/core/common/encryption/IEncryptionService'
import type IVaultStore from './lib/core/common/storage/IVaultStorage'
import type IStorage from './lib/core/common/storage/IStorage'
import type IEntity from './lib/core/common/IEntity'
import type {IAbstractNetwork} from './lib/core/network/IAbstractNetwork'
import type {INetworkOptions} from "./lib/core/network/INetworkOptions";

export type {
  IEncryptionService,
  IVaultStore,
  IStorage,
  IEntity,
  IAbstractNetwork,
  INetworkOptions,
};

export { EncryptionServiceSpecFactory };
