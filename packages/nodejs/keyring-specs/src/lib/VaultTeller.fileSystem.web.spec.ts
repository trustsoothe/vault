import {describe} from 'vitest'
import VaultTellerSpecFactory from './VaultTeller.specFactory'
import {FileSystemVaultStorage, FileSystemSessionStorage} from '@poktscan/keyring-storage-filesystem'
import {WebEncryptionService} from '@poktscan/keyring-encryption-web'
import {IStorage, IVaultStore, SerializedSession} from "@poktscan/keyring"

describe('VaultTeller with FileSystemStorage and WebEncryption', () => {
  const vaultStorageFactory = (): IVaultStore => new FileSystemVaultStorage(`/tmp/test-vault-${Date.now()}.json`)
  const sessionStorageFactory = (): IStorage<SerializedSession> => new FileSystemSessionStorage(`/tmp/test-session-${Date.now()}.json`)

  VaultTellerSpecFactory(vaultStorageFactory, sessionStorageFactory, WebEncryptionService)
})
