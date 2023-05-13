import {IEncryptionService, ISessionStore, IVaultStore, VaultTeller, Session} from '@poktscan/keyring'
import {afterEach, beforeEach, beforeAll, describe, expect, test} from 'vitest'
import { FileSystemVaultStorage, FileSystemSessionStorage } from '@poktscan/keyring-storage-filesystem'
import { SJCLEncryptionService } from '@poktscan/keyring-encryption-sjcl'
import sinon from 'sinon'

describe('VaultTeller', () => {
  let vaultStore: IVaultStore = null
  let sessionStore: ISessionStore = null
  let encryptionService: IEncryptionService = null

  beforeAll(() => {
    sessionStore = new FileSystemSessionStorage('/tmp/key-manager-test-sessions.json');
  })

  beforeEach(() => {
    vaultStore = null
    encryptionService = new SJCLEncryptionService()
  })

  afterEach(async () => {
    if (sessionStore) {
      await sessionStore.removeAll()
    }
  })

  describe('unlockVault', () => {
    test('throws an error if the passed passphrase is null or empty', async () => {
      const keyManager = new VaultTeller(vaultStore, sessionStore, encryptionService)
      const authorizeOwnerOperation = keyManager.unlockVault(null)
      await expect(authorizeOwnerOperation).rejects.toThrow('Passphrase cannot be null or empty')
    })

    test('throws an error if the vault store is not initialized', async () => {
      vaultStore = new FileSystemVaultStorage(`/tmp/.test-vault-uninitialized-${Date.now()}.json`)
      sinon.stub(vaultStore, 'get').returns(null)
      const keyManager = new VaultTeller(vaultStore, sessionStore, encryptionService)
      const authorizeOwnerOperation = keyManager.unlockVault('passphrase')
      await expect(authorizeOwnerOperation).rejects.toThrow('Vault could not be restored from store. Has it been initialized?');
    })

    test('throws an error if the provided passphrase is incorrect', async () => {
      vaultStore = new FileSystemVaultStorage(`/tmp/.test-vault-incorrectPass-${Date.now()}.json`);
      const keyManager = new VaultTeller(vaultStore, sessionStore, encryptionService)
      await keyManager.initializeVault('passphrase')
      const authorizeOwnerOperation = keyManager.unlockVault('wrong-passphrase')
      await expect(authorizeOwnerOperation).rejects.toThrow('Unable to restore vault. Is passphrase incorrect?');
    })

    describe('when the vault is initialized and the passphrase is correct', () => {
      test('changes "isUnlocked" to true (the internal in memory vault is assigned)', async () => {
        vaultStore = new FileSystemVaultStorage(`/tmp/.test-vault-isUnlocked-${Date.now()}.json`);
        const keyManager = new VaultTeller(vaultStore, sessionStore, encryptionService)
        await keyManager.initializeVault('passphrase')
        await keyManager.unlockVault('passphrase')
        expect(keyManager.isUnlocked).toBe(true)
      })

      test('returns a new Session object', async () => {
        vaultStore = new FileSystemVaultStorage(`/tmp/.test-vault-session-${Date.now()}.json`);
        const keyManager = new VaultTeller(vaultStore, sessionStore, encryptionService)
        await keyManager.initializeVault('passphrase')
        const session = await keyManager.unlockVault('passphrase')
        expect(session).toBeInstanceOf(Session)
      })

      test('returns a new Session object with a maxAge of an hour', async () => {
        vaultStore = new FileSystemVaultStorage(`/tmp/.test-vault-session-${Date.now()}.json`);
        const keyManager = new VaultTeller(vaultStore, sessionStore, encryptionService)
        await keyManager.initializeVault('passphrase');
        const session = await keyManager.unlockVault('passphrase')
        expect(session.maxAge).toBe(3600)
      })

      test('persists the newly created session', async () => {
        vaultStore = new FileSystemVaultStorage(`/tmp/.test-vault-session-${Date.now()}.json`);
        const keyManager = new VaultTeller(vaultStore, sessionStore, encryptionService)
        await keyManager.initializeVault('passphrase');
        const session = await keyManager.unlockVault('passphrase')
        const serializedSession = await sessionStore.getById(session.id)
        expect(serializedSession, 'Session was not found').not.toBeNull()
        const persistedSession = Session.deserialize(serializedSession)
        expect(persistedSession).toStrictEqual(session)
      })
    })
  })

  describe('lockVault', function () {
    test('changes "isUnlocked" to false (the internal in memory vault is de-assigned)', async () => {
      vaultStore = new FileSystemVaultStorage(`/tmp/.test-vault-lockVault-${Date.now()}.json`);
      const keyManager = new VaultTeller(vaultStore, sessionStore, encryptionService)
      await keyManager.initializeVault('passphrase')
      await keyManager.unlockVault('passphrase')
      keyManager.lockVault()
      expect(keyManager.isUnlocked).toBe(false)
    })
  })

  describe('initializeVault', () => {
    test('throws an error if the passed passphrase is null or empty', async () => {
      vaultStore = new FileSystemVaultStorage(`/tmp/.test-vault-${Date.now()}.json`);
      const keyManager = new VaultTeller(vaultStore, sessionStore, encryptionService)
      const initializeVaultOperation = keyManager.initializeVault(null)
      await expect(initializeVaultOperation).rejects.toThrow('Passphrase cannot be null or empty')
    });

    test('throws an error if the vault store is already initialized', async () => {
      vaultStore = new FileSystemVaultStorage(`/tmp/.test-vault-initialized-${Date.now()}.json`);
      const keyManager = new VaultTeller(vaultStore, sessionStore, encryptionService);
      await keyManager.initializeVault('passphrase');
      const secondInitializeVaultOperation = keyManager.initializeVault('passphrase')
      await expect(secondInitializeVaultOperation).rejects.toThrow('Vault is already initialized');
    });
  })
})
