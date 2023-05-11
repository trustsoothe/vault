import {IEncryptionService, ISessionStore, IVaultStore, KeyManager} from '@poktscan/keyring'
import {beforeEach, describe, expect, test} from 'vitest'
import { FileSystemVaultStorage } from '@poktscan/keyring-storage-filesystem'
import { SJCLEncryptionService } from '@poktscan/keyring-encryption-sjcl'
import sinon from 'sinon'

describe('KeyManager', () => {
  let vaultStore: IVaultStore = null
  let sessionStore: ISessionStore = null
  let encryptionService: IEncryptionService = null

  beforeEach(() => {
    vaultStore = null
    sessionStore = null
    encryptionService = new SJCLEncryptionService()
  })

  describe('unlockVault', () => {
    test('throws an error if the passed passphrase is null or empty', async () => {
      const keyManager = new KeyManager(vaultStore, sessionStore, encryptionService)
      const authorizeOwnerOperation = keyManager.unlockVault(null)
      await expect(authorizeOwnerOperation).rejects.toThrow('Passphrase cannot be null or empty')
    })

    test('throws an error if the vault store is not initialized', async () => {
      vaultStore = new FileSystemVaultStorage(`/tmp/.test-vault-uninitialized-${Date.now()}.json`)
      sinon.stub(vaultStore, 'get').returns(null)
      const keyManager = new KeyManager(vaultStore, sessionStore, encryptionService)
      const authorizeOwnerOperation = keyManager.unlockVault('passphrase')
      await expect(authorizeOwnerOperation).rejects.toThrow('Vault could not be restored from store. Has it been initialized?');
    })

    test('throws an error if the provided passphrase is incorrect', async () => {
      vaultStore = new FileSystemVaultStorage(`/tmp/.test-vault-incorrectPass-${Date.now()}.json`);
      const keyManager = new KeyManager(vaultStore, sessionStore, encryptionService)
      await keyManager.initializeVault('passphrase')
      const authorizeOwnerOperation = keyManager.unlockVault('wrong-passphrase')
      await expect(authorizeOwnerOperation).rejects.toThrow('Unable to restore vault. Is passphrase incorrect?');
    })

    test('set "isUnlocked" to true (the internal in memory vault is assigned)', async () => {
      vaultStore = new FileSystemVaultStorage(`/tmp/.test-vault-isUnlocked-${Date.now()}.json`);
      const keyManager = new KeyManager(vaultStore, sessionStore, encryptionService)
      await keyManager.initializeVault('passphrase')
      await keyManager.unlockVault('passphrase')
      expect(keyManager.isUnlocked).toBe(true)
    })
  })

  describe('lockVault', function () {
    test('set "isUnlocked" to false (the internal in memory vault is de-assigned)', async () => {
      vaultStore = new FileSystemVaultStorage(`/tmp/.test-vault-lockVault-${Date.now()}.json`);
      const keyManager = new KeyManager(vaultStore, sessionStore, encryptionService)
      await keyManager.initializeVault('passphrase')
      await keyManager.unlockVault('passphrase')
      keyManager.lockVault()
      expect(keyManager.isUnlocked).toBe(false)
    })
  })

  describe('initializeVault', () => {
    test('throws an error if the passed passphrase is null or empty', async () => {
      vaultStore = new FileSystemVaultStorage(`/tmp/.test-vault-${Date.now()}.json`);
      const keyManager = new KeyManager(vaultStore, sessionStore, encryptionService)
      const initializeVaultOperation = keyManager.initializeVault(null)
      await expect(initializeVaultOperation).rejects.toThrow('Passphrase cannot be null or empty')
    });

    test('throws an error if the vault store is already initialized', async () => {
      vaultStore = new FileSystemVaultStorage(`/tmp/.test-vault-initialized-${Date.now()}.json`);
      const keyManager = new KeyManager(vaultStore, sessionStore, encryptionService);
      await keyManager.initializeVault('passphrase');
      const secondInitializeVaultOperation = keyManager.initializeVault('passphrase')
      await expect(secondInitializeVaultOperation).rejects.toThrow('Vault is already initialized');
    });
  })
})
