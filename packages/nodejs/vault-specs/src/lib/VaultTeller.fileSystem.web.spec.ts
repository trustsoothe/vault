import { describe } from 'vitest'
import VaultTellerSpecFactory from './VaultTeller.specFactory'
// @ts-ignore
import { FileSystemVaultStorage, FileSystemSessionStorage } from '@soothe/vault-storage-filesystem'
// @ts-ignore
import { WebEncryptionService } from '@soothe/vault-encryption-web'
import { IStorage, IVaultStore, SerializedSession } from '@soothe/vault'

describe('VaultTeller with FileSystemStorage and WebEncryption', () => {
  const vaultStorageFactory = (): IVaultStore => new FileSystemVaultStorage(`/tmp/test-vault-${Date.now()}.json`)
  const sessionStorageFactory = (): IStorage<SerializedSession> => new FileSystemSessionStorage(`/tmp/test-session-${Date.now()}.json`)

  VaultTellerSpecFactory(vaultStorageFactory, sessionStorageFactory, WebEncryptionService)
})
