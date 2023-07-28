import {describe} from 'vitest'
import VaultTellerSpecFactory from './VaultTeller.specFactory'
// @ts-ignore
import {FileSystemVaultStorage, FileSystemSessionStorage} from '@poktscan/keyring-storage-filesystem'
// @ts-ignore
import {WebEncryptionService} from '@poktscan/keyring-encryption-web'
import {IStorage, IVaultStore, SerializedSession} from "@poktscan/keyring"

describe('VaultTeller with FileSystemStorage and WebEncryption', () => {
  const vaultStorageFactory = (): IVaultStore => new FileSystemVaultStorage(`/tmp/test-vault-${Date.now()}.json`)
  const sessionStorageFactory = (): IStorage<SerializedSession> => new FileSystemSessionStorage(`/tmp/test-session-${Date.now()}.json`)

  VaultTellerSpecFactory(vaultStorageFactory, sessionStorageFactory, WebEncryptionService)
})
