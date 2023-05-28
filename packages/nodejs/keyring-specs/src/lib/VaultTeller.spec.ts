import {
  Account,
  ExternalAccessRequest,
  IEncryptionService,
  ISessionStore,
  IVaultStore,
  Permission,
  PermissionsBuilder,
  Session,
  SupportedProtocols,
  OriginReference,
  VaultTeller
} from '@poktscan/keyring'
import {afterEach, beforeAll, beforeEach, describe, expect, test} from 'vitest'
import {FileSystemSessionStorage, FileSystemVaultStorage} from '@poktscan/keyring-storage-filesystem'
import {SJCLEncryptionService} from '@poktscan/keyring-encryption-sjcl'
import sinon from 'sinon'
import {v4} from "uuid";

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
      const vaultTeller = new VaultTeller(vaultStore, sessionStore, encryptionService)
      const authorizeOwnerOperation = vaultTeller.unlockVault(null)
      await expect(authorizeOwnerOperation).rejects.toThrow('Passphrase cannot be null or empty')
    })

    test('throws an error if the vault store is not initialized', async () => {
      vaultStore = new FileSystemVaultStorage(`/tmp/.test-vault-uninitialized-${Date.now()}.json`)
      sinon.stub(vaultStore, 'get').returns(null)
      const vaultTeller = new VaultTeller(vaultStore, sessionStore, encryptionService)
      const authorizeOwnerOperation = vaultTeller.unlockVault('passphrase')
      await expect(authorizeOwnerOperation).rejects.toThrow('Vault could not be restored from store. Has it been initialized?');
    })

    test('throws an error if the provided passphrase is incorrect', async () => {
      vaultStore = new FileSystemVaultStorage(`/tmp/.test-vault-incorrectPass-${Date.now()}.json`);
      const vaultTeller = new VaultTeller(vaultStore, sessionStore, encryptionService)
      await vaultTeller.initializeVault('passphrase')
      const authorizeOwnerOperation = vaultTeller.unlockVault('wrong-passphrase')
      await expect(authorizeOwnerOperation).rejects.toThrow('Unable to restore vault. Is passphrase incorrect?');
    })

    describe('when the vault is initialized and the passphrase is correct', () => {
      test('changes "isUnlocked" to true (the internal in memory vault is assigned)', async () => {
        vaultStore = new FileSystemVaultStorage(`/tmp/.test-vault-isUnlocked-${Date.now()}.json`);
        const vaultTeller = new VaultTeller(vaultStore, sessionStore, encryptionService)
        await vaultTeller.initializeVault('passphrase')
        await vaultTeller.unlockVault('passphrase')
        expect(vaultTeller.isUnlocked).toBe(true)
      })

      test('returns a new Session object', async () => {
        vaultStore = new FileSystemVaultStorage(`/tmp/.test-vault-session-${Date.now()}.json`);
        const vaultTeller = new VaultTeller(vaultStore, sessionStore, encryptionService)
        await vaultTeller.initializeVault('passphrase')
        const session = await vaultTeller.unlockVault('passphrase')
        expect(session).toBeInstanceOf(Session)
      })

      test('returns a new Session object with a maxAge of an hour', async () => {
        vaultStore = new FileSystemVaultStorage(`/tmp/.test-vault-session-${Date.now()}.json`);
        const vaultTeller = new VaultTeller(vaultStore, sessionStore, encryptionService)
        await vaultTeller.initializeVault('passphrase');
        const session = await vaultTeller.unlockVault('passphrase')
        expect(session.maxAge).toBe(3600)
      })

      test('persists the newly created session', async () => {
        vaultStore = new FileSystemVaultStorage(`/tmp/.test-vault-session-${Date.now()}.json`);
        const vaultTeller = new VaultTeller(vaultStore, sessionStore, encryptionService)
        await vaultTeller.initializeVault('passphrase');
        const session = await vaultTeller.unlockVault('passphrase')
        const serializedSession = await sessionStore.getById(session.id)
        expect(serializedSession, 'Session was not found').not.toBeNull()
        const persistedSession = Session.deserialize(serializedSession)
        expect(persistedSession).toStrictEqual(session)
      })

      test('newly created session has all permissions for the account resource', async () => {
        vaultStore = new FileSystemVaultStorage(`/tmp/.test-vault-session-accounts-permissions-${Date.now()}.json`)
        const vaultTeller = new VaultTeller(vaultStore, sessionStore, encryptionService)
        await vaultTeller.initializeVault('passphrase')
        const { permissions } = await vaultTeller.unlockVault('passphrase')
        const expectedPermissions
          = new PermissionsBuilder().forResource('account').allowEverything().onAny().build()
        expect(permissions).toEqual(expect.arrayContaining(expectedPermissions))
      })

      test('newly created session has all permissions for the transaction resource', async () => {
        vaultStore = new FileSystemVaultStorage(`/tmp/.test-vault-session-transaction-permissions-${Date.now()}.json`)
        const vaultTeller = new VaultTeller(vaultStore, sessionStore, encryptionService)
        await vaultTeller.initializeVault('passphrase')
        const { permissions } = await vaultTeller.unlockVault('passphrase')
        const expectedPermissions
          = new PermissionsBuilder().forResource('transaction').allowEverything().onAny().build()
        expect(permissions).toEqual(expect.arrayContaining(expectedPermissions))
      })

      test('newly created session has all permissions for the session resource', async () => {
        vaultStore = new FileSystemVaultStorage(`/tmp/.test-vault-session-permissions-${Date.now()}.json`)
        const vaultTeller = new VaultTeller(vaultStore, sessionStore, encryptionService)
        await vaultTeller.initializeVault('passphrase')
        const { permissions } = await vaultTeller.unlockVault('passphrase')
        const expectedPermissions
          = new PermissionsBuilder().forResource('session').allowEverything().onAny().build()
        expect(permissions).toEqual(expect.arrayContaining(expectedPermissions))
      })

      test('newly created session has no accounts associated with it', async () => {
        vaultStore = new FileSystemVaultStorage(`/tmp/.test-vault-session-${Date.now()}.json`);
        const vaultTeller = new VaultTeller(vaultStore, sessionStore, encryptionService)
        await vaultTeller.initializeVault('passphrase');
        const session = await vaultTeller.unlockVault('passphrase')
        expect(session.accounts).toEqual([])
      })
    })
  })

  describe('authorizeExternal', () => {
    const exampleOriginReference: OriginReference = new OriginReference('https://example.com')
    let exampleAccount: Account
    let exampleExternalPermissions: Permission[]
    let exampleExternalAccessRequest: ExternalAccessRequest

    beforeEach(() => {
      exampleAccount =
        new Account(
          '123',
          '1234',
          '1234',
          SupportedProtocols.POCKET_NETWORK,
          v4()
        )

      exampleExternalPermissions =
       new PermissionsBuilder().forResource('account').allow('read').on(exampleAccount.id).build()

      exampleExternalAccessRequest =
        new ExternalAccessRequest(
          exampleExternalPermissions,
          6000,
          exampleOriginReference,
          [exampleAccount.asAccountReference()]
        )
    })

    test('throws an error if the vault is not unlocked', async () => {
      vaultStore = new FileSystemVaultStorage(`/tmp/.test-external-access-vault-${Date.now()}.json`);
      const vaultTeller = new VaultTeller(vaultStore, sessionStore, encryptionService)
      await vaultTeller.initializeVault('passphrase');
      const authorizeExternalAccessOperation = vaultTeller.authorizeExternal(exampleExternalAccessRequest)
      await expect(authorizeExternalAccessOperation).rejects.toThrow('Vault must be unlocked to authorize external access')
    })

    test('expects a valid ExternalAccessRequest object', async () => {
      vaultStore = new FileSystemVaultStorage(`/tmp/.test-external-access-input-${Date.now()}.json`);
      const vaultTeller = new VaultTeller(vaultStore, sessionStore, encryptionService)
      await vaultTeller.initializeVault('passphrase')
      await vaultTeller.unlockVault('passphrase')
      const authorizeExternalAccessOperation = vaultTeller.authorizeExternal(null)
      await expect(authorizeExternalAccessOperation).rejects.toThrow('ExternalAccessRequest object is required')
    })

    describe('when successful', () => {
      test('resolves to a valid Session object', async () => {
        vaultStore = new FileSystemVaultStorage(`/tmp/.test-external-access-session-${Date.now()}.json`);
        const vaultTeller = new VaultTeller(vaultStore, sessionStore, encryptionService)
        await vaultTeller.initializeVault('passphrase')
        await vaultTeller.unlockVault('passphrase')
        const session = await vaultTeller.authorizeExternal(exampleExternalAccessRequest)
        expect(session).toBeInstanceOf(Session)
      })

      test('resolves to a valid Session object with the correct permissions', async () => {
        vaultStore = new FileSystemVaultStorage(`/tmp/.test-external-access-session-permissions-${Date.now()}.json`);
        const vaultTeller = new VaultTeller(vaultStore, sessionStore, encryptionService)
        await vaultTeller.initializeVault('passphrase')
        await vaultTeller.unlockVault('passphrase')
        const {permissions} = await vaultTeller.authorizeExternal(exampleExternalAccessRequest)
        expect(permissions).toEqual(exampleExternalPermissions)
      })

      test('resolved Session object has the correct maxAge', async () => {
        vaultStore = new FileSystemVaultStorage(`/tmp/.test-external-access-session-maxAge-${Date.now()}.json`);
        const vaultTeller = new VaultTeller(vaultStore, sessionStore, encryptionService)
        await vaultTeller.initializeVault('passphrase')
        await vaultTeller.unlockVault('passphrase')
        const {maxAge} = await vaultTeller.authorizeExternal(exampleExternalAccessRequest)
        expect(maxAge).toEqual(exampleExternalAccessRequest.maxAge)
      })

      test('resolved Session object has the correct origin', async () => {
        vaultStore = new FileSystemVaultStorage(`/tmp/.test-external-access-session-origin-${Date.now()}.json`);
        const vaultTeller = new VaultTeller(vaultStore, sessionStore, encryptionService)
        await vaultTeller.initializeVault('passphrase')
        await vaultTeller.unlockVault('passphrase')
        const {origin} = await vaultTeller.authorizeExternal(exampleExternalAccessRequest)
        expect(origin).toEqual(exampleExternalAccessRequest.origin)
      })

      test('resolved Session object has the correct accounts', async () => {
        vaultStore = new FileSystemVaultStorage(`/tmp/.test-external-access-session-accounts-${Date.now()}.json`);
        const vaultTeller = new VaultTeller(vaultStore, sessionStore, encryptionService)
        await vaultTeller.initializeVault('passphrase')
        await vaultTeller.unlockVault('passphrase')
        const {accounts} = await vaultTeller.authorizeExternal(exampleExternalAccessRequest)
        expect(accounts).toEqual(exampleExternalAccessRequest.accounts)
      })

      test('persists the session', async () => {
        vaultStore = new FileSystemVaultStorage(`/tmp/.test-external-access-persist-${Date.now()}.json`);
        const vaultTeller = new VaultTeller(vaultStore, sessionStore, encryptionService)
        await vaultTeller.initializeVault('passphrase')
        await vaultTeller.unlockVault('passphrase')
        const session = await vaultTeller.authorizeExternal(exampleExternalAccessRequest)
        const persistedSession = await sessionStore.getById(session.id)
        expect(persistedSession, 'The session was expected to be found in the persistence storage.').not.toBeNull()
        const expectedSession = Session.deserialize(persistedSession)
        expect(session).toEqual(expectedSession)
      })
    })
  })

  describe('lockVault', function () {
    test('changes "isUnlocked" to false (the internal in memory vault is de-assigned)', async () => {
      vaultStore = new FileSystemVaultStorage(`/tmp/.test-vault-lockVault-${Date.now()}.json`);
      const vaultTeller = new VaultTeller(vaultStore, sessionStore, encryptionService)
      await vaultTeller.initializeVault('passphrase')
      await vaultTeller.unlockVault('passphrase')
      vaultTeller.lockVault()
      expect(vaultTeller.isUnlocked).toBe(false)
    })
  })

  describe('initializeVault', () => {
    test('throws an error if the passed passphrase is null or empty', async () => {
      vaultStore = new FileSystemVaultStorage(`/tmp/.test-vault-${Date.now()}.json`);
      const vaultTeller = new VaultTeller(vaultStore, sessionStore, encryptionService)
      const initializeVaultOperation = vaultTeller.initializeVault(null)
      await expect(initializeVaultOperation).rejects.toThrow('Passphrase cannot be null or empty')
    });

    test('throws an error if the vault store is already initialized', async () => {
      vaultStore = new FileSystemVaultStorage(`/tmp/.test-vault-initialized-${Date.now()}.json`);
      const vaultTeller = new VaultTeller(vaultStore, sessionStore, encryptionService);
      await vaultTeller.initializeVault('passphrase');
      const secondInitializeVaultOperation = vaultTeller.initializeVault('passphrase')
      await expect(secondInitializeVaultOperation).rejects.toThrow('Vault is already initialized');
    });
  })

  describe('isSessionValid', () => {
    test('returns false if the session id is null or undefined', async () => {
      vaultStore = new FileSystemVaultStorage(`/tmp/.test-vault-isValidSession-undefined-${Date.now()}.json`);
      const vaultTeller = new VaultTeller(vaultStore, sessionStore, encryptionService);
      const isSessionValid = await vaultTeller.isSessionValid(null)
      expect(isSessionValid).toBe(false)
    })

    test('returns false if the session id is not found in the session store', async () => {
      vaultStore = new FileSystemVaultStorage(`/tmp/.test-vault-isValidSession-notFound-${Date.now()}.json`);
      const vaultTeller = new VaultTeller(vaultStore, sessionStore, encryptionService);
      const isSessionValid = await vaultTeller.isSessionValid('not-found')
      expect(isSessionValid).toBe(false)
    })

    test('returns false if the session id is found in the session store but is expired', async () => {
      // Initialize the storage before setting the fake timers since these will have them go to zero
      vaultStore = new FileSystemVaultStorage(`/tmp/.test-vault-isValidSession-expired-${Date.now()}.json`);
      const clock = sinon.useFakeTimers();
      const vaultTeller = new VaultTeller(vaultStore, sessionStore, encryptionService);
      await vaultTeller.initializeVault('passphrase')
      const session = await vaultTeller.unlockVault('passphrase')
      clock.tick(3600 * 1000)
      const isSessionValid = await vaultTeller.isSessionValid(session.id)
      expect(isSessionValid).toBe(false)
      clock.restore()
    })

    test('returns true if the session id is found in the session store and is not expired', async () => {
      vaultStore = new FileSystemVaultStorage(`/tmp/.test-vault-isValidSession-valid-${Date.now()}.json`);
      const vaultTeller = new VaultTeller(vaultStore, sessionStore, encryptionService);
      await vaultTeller.initializeVault('passphrase')
      const session = await vaultTeller.unlockVault('passphrase')
      const isSessionValid = await vaultTeller.isSessionValid(session.id)
      expect(isSessionValid).toBe(true)
    })
  })
})
