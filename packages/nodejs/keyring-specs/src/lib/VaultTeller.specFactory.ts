import {
  Account,
  AccountOptions,
  Asset,
  ExternalAccessRequest,
  IEncryptionService,
  IStorage,
  IVaultStore,
  OriginReference,
  Permission,
  PermissionsBuilder,
  SerializedSession,
  Session,
  SupportedProtocols,
  VaultTeller,
} from '@poktscan/keyring'
import {afterEach, beforeAll, beforeEach, describe, expect, test} from 'vitest'
import sinon from 'sinon'
import {v4} from "uuid";

export default <
  TEncryptionService extends IEncryptionService,
  TSessionStore extends IStorage<SerializedSession>,
  TVaultStore extends IVaultStore>(
    TVaultStoreCreator: {  new (): TVaultStore } | (() => TVaultStore),
    TSessionStoreCreator: {  new (): TSessionStore } | (() => IStorage<SerializedSession>),
    TEncryptionServiceCreator: {  new (): TEncryptionService } | (() => TEncryptionService)
  ) => {

  let vaultStore: TVaultStore = null
  let sessionStore: TSessionStore = null
  let encryptionService: TEncryptionService = null
  const exampleOriginReference: OriginReference = new OriginReference('https://example.com')
  let exampleAsset: Asset
  let exampleAccount: Account
  let exampleExternalPermissions: Permission[]
  let exampleExternalAccessRequest: ExternalAccessRequest

  function isConstructor<T>(creator: {  new (): T } | (() => T)) {
    return !!creator && !!creator.prototype && !!creator.prototype.constructor
  }

  function createVaultStore() : TVaultStore {
    return isConstructor<TVaultStore>(TVaultStoreCreator)
      // @ts-ignore
      ? new TVaultStoreCreator()
      // @ts-ignore
      : TVaultStoreCreator()
  }

  beforeEach(() => {
    vaultStore = null

    encryptionService =
        isConstructor<TEncryptionService>(TEncryptionServiceCreator)
            // @ts-ignore
          ? new TEncryptionServiceCreator()
            // @ts-ignore
          : TEncryptionServiceCreator()

    exampleAsset = new Asset({
      name: 'Example Asset',
      protocol: {
        name: SupportedProtocols.Unspecified,
        chainID: 'unspecified'
      },
      symbol: 'EXM'
    })

    const options: AccountOptions = {
      publicKey: '1234',
      privateKey: '1234',
      address: 'derived-address',
      asset: exampleAsset
    }

    exampleAccount =
      new Account(
        options,
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

  beforeAll(() => {
    sessionStore = isConstructor<IStorage<SerializedSession>>(TSessionStoreCreator)
      // @ts-ignore
      ? new TSessionStoreCreator()
      // @ts-ignore
      : TSessionStoreCreator()
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
      vaultStore = createVaultStore()
      sinon.stub(vaultStore, 'get').returns(null)
      const vaultTeller = new VaultTeller(vaultStore, sessionStore, encryptionService)
      const authorizeOwnerOperation = vaultTeller.unlockVault('passphrase')
      await expect(authorizeOwnerOperation).rejects.toThrow('Vault could not be restored from store. Has it been initialized?');
    })

    test('throws an error if the provided passphrase is incorrect', async () => {
      vaultStore = createVaultStore()
      const vaultTeller = new VaultTeller(vaultStore, sessionStore, encryptionService)
      await vaultTeller.initializeVault('passphrase')
      const authorizeOwnerOperation = vaultTeller.unlockVault('wrong-passphrase')
      await expect(authorizeOwnerOperation).rejects.toThrow('Unable to restore vault. Is passphrase incorrect?')
    })

    describe('when the vault is initialized and the passphrase is correct', () => {
      test('changes "isUnlocked" to true (the internal in memory vault is assigned)', async () => {
        vaultStore = createVaultStore()
        const vaultTeller = new VaultTeller(vaultStore, sessionStore, encryptionService)
        await vaultTeller.initializeVault('passphrase')
        await vaultTeller.unlockVault('passphrase')
        expect(vaultTeller.isUnlocked).toBe(true)
      })

      test('returns a new Session object', async () => {
        vaultStore = createVaultStore()
        const vaultTeller = new VaultTeller(vaultStore, sessionStore, encryptionService)
        await vaultTeller.initializeVault('passphrase')
        const session = await vaultTeller.unlockVault('passphrase')
        expect(session).toBeInstanceOf(Session)
      })

      test('returns a new Session object with a maxAge of of zero (do not expire)', async () => {
        vaultStore = createVaultStore()
        const vaultTeller = new VaultTeller(vaultStore, sessionStore, encryptionService)
        await vaultTeller.initializeVault('passphrase');
        const session = await vaultTeller.unlockVault('passphrase')
        expect(session.maxAge).toBe(0)
      })

      test('persists the newly created session', async () => {
        vaultStore = createVaultStore()
        const vaultTeller = new VaultTeller(vaultStore, sessionStore, encryptionService)
        await vaultTeller.initializeVault('passphrase');
        const session = await vaultTeller.unlockVault('passphrase')
        const serializedSession = await sessionStore.getById(session.id)
        expect(serializedSession, 'Session was not found').not.toBeNull()
        const persistedSession = Session.deserialize(serializedSession)
        expect(persistedSession).toStrictEqual(session)
      })

      test('newly created session has all permissions for the account resource', async () => {
        vaultStore = createVaultStore()
        const vaultTeller = new VaultTeller(vaultStore, sessionStore, encryptionService)
        await vaultTeller.initializeVault('passphrase')
        const { permissions } = await vaultTeller.unlockVault('passphrase')
        const expectedPermissions
          = new PermissionsBuilder().forResource('account').allowEverything().onAny().build()
        expect(permissions).toEqual(expect.arrayContaining(expectedPermissions))
      })

      test('newly created session has all permissions for the transaction resource', async () => {
        vaultStore = createVaultStore()
        const vaultTeller = new VaultTeller(vaultStore, sessionStore, encryptionService)
        await vaultTeller.initializeVault('passphrase')
        const { permissions } = await vaultTeller.unlockVault('passphrase')
        const expectedPermissions
          = new PermissionsBuilder().forResource('transaction').allowEverything().onAny().build()
        expect(permissions).toEqual(expect.arrayContaining(expectedPermissions))
      })

      test('newly created session has all permissions for the session resource', async () => {
        vaultStore = createVaultStore()
        const vaultTeller = new VaultTeller(vaultStore, sessionStore, encryptionService)
        await vaultTeller.initializeVault('passphrase')
        const { permissions } = await vaultTeller.unlockVault('passphrase')
        const expectedPermissions
          = new PermissionsBuilder().forResource('session').allowEverything().onAny().build()
        expect(permissions).toEqual(expect.arrayContaining(expectedPermissions))
      })
    })
  })

  describe('authorizeExternal', () => {
    test('throws an error if the vault is not unlocked', async () => {
      vaultStore = createVaultStore()
      const vaultTeller = new VaultTeller(vaultStore, sessionStore, encryptionService)
      await vaultTeller.initializeVault('passphrase');
      const authorizeExternalAccessOperation = vaultTeller.authorizeExternal(exampleExternalAccessRequest)
      await expect(authorizeExternalAccessOperation).rejects.toThrow('Vault must be unlocked to authorize external access')
    })

    test('expects a valid ExternalAccessRequest object', async () => {
      vaultStore = createVaultStore()
      const vaultTeller = new VaultTeller(vaultStore, sessionStore, encryptionService)
      await vaultTeller.initializeVault('passphrase')
      await vaultTeller.unlockVault('passphrase')
      const authorizeExternalAccessOperation = vaultTeller.authorizeExternal(null)
      await expect(authorizeExternalAccessOperation).rejects.toThrow('ExternalAccessRequest object is required')
    })

    describe('when successful', () => {
      test('resolves to a valid Session object', async () => {
        vaultStore = createVaultStore()
        const vaultTeller = new VaultTeller(vaultStore, sessionStore, encryptionService)
        await vaultTeller.initializeVault('passphrase')
        await vaultTeller.unlockVault('passphrase')
        const session = await vaultTeller.authorizeExternal(exampleExternalAccessRequest)
        expect(session).toBeInstanceOf(Session)
      })

      test('resolves to a valid Session object with the correct permissions', async () => {
        vaultStore = createVaultStore()
        const vaultTeller = new VaultTeller(vaultStore, sessionStore, encryptionService)
        await vaultTeller.initializeVault('passphrase')
        await vaultTeller.unlockVault('passphrase')
        const {permissions} = await vaultTeller.authorizeExternal(exampleExternalAccessRequest)
        expect(permissions).toEqual(exampleExternalPermissions)
      })

      test('resolved Session object has the correct maxAge', async () => {
        vaultStore = createVaultStore()
        const vaultTeller = new VaultTeller(vaultStore, sessionStore, encryptionService)
        await vaultTeller.initializeVault('passphrase')
        await vaultTeller.unlockVault('passphrase')
        const {maxAge} = await vaultTeller.authorizeExternal(exampleExternalAccessRequest)
        expect(maxAge).toEqual(exampleExternalAccessRequest.maxAge)
      })

      test('resolved Session object has the correct origin', async () => {
        vaultStore = createVaultStore()
        const vaultTeller = new VaultTeller(vaultStore, sessionStore, encryptionService)
        await vaultTeller.initializeVault('passphrase')
        await vaultTeller.unlockVault('passphrase')
        const {origin} = await vaultTeller.authorizeExternal(exampleExternalAccessRequest)
        expect(origin).toEqual(exampleExternalAccessRequest.origin)
      })

      test('persists the session', async () => {
        vaultStore = createVaultStore()
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
      vaultStore = createVaultStore()
      const vaultTeller = new VaultTeller(vaultStore, sessionStore, encryptionService)
      await vaultTeller.initializeVault('passphrase')
      await vaultTeller.unlockVault('passphrase')
      vaultTeller.lockVault()
      expect(vaultTeller.isUnlocked).toBe(false)
    })
  })

  describe('initializeVault', () => {
    test('throws an error if the passed passphrase is null or empty', async () => {
      vaultStore = createVaultStore()
      const vaultTeller = new VaultTeller(vaultStore, sessionStore, encryptionService)
      const initializeVaultOperation = vaultTeller.initializeVault(null)
      await expect(initializeVaultOperation).rejects.toThrow('Passphrase cannot be null or empty')
    });

    test('throws an error if the vault store is already initialized', async () => {
      vaultStore = createVaultStore()
      const vaultTeller = new VaultTeller(vaultStore, sessionStore, encryptionService);
      await vaultTeller.initializeVault('passphrase');
      const secondInitializeVaultOperation = vaultTeller.initializeVault('passphrase')
      await expect(secondInitializeVaultOperation).rejects.toThrow('Vault is already initialized');
    });
  })

  describe('isSessionValid', () => {
    test('returns false if the session id is null or undefined', async () => {
      vaultStore = createVaultStore()
      const vaultTeller = new VaultTeller(vaultStore, sessionStore, encryptionService);
      const isSessionValid = await vaultTeller.isSessionValid(null)
      expect(isSessionValid).toBe(false)
    })

    test('returns false if the session id is not found in the session store', async () => {
      vaultStore = createVaultStore()
      const vaultTeller = new VaultTeller(vaultStore, sessionStore, encryptionService);
      const isSessionValid = await vaultTeller.isSessionValid('not-found')
      expect(isSessionValid).toBe(false)
    })

    test('returns true if the session id is found in the session store and is not expired', async () => {
      vaultStore = createVaultStore()
      const vaultTeller = new VaultTeller(vaultStore, sessionStore, encryptionService);
      await vaultTeller.initializeVault('passphrase')
      const session = await vaultTeller.unlockVault('passphrase')
      const isSessionValid = await vaultTeller.isSessionValid(session.id)
      expect(isSessionValid).toBe(true)
    })
  })

  describe('listSessions', () => {
    test('throws "Unauthorized" error if the session id is not provided', async () => {
      vaultStore = createVaultStore()
      const vaultTeller = new VaultTeller(vaultStore, sessionStore, encryptionService)
      await vaultTeller.initializeVault('passphrase')
      await vaultTeller.unlockVault('passphrase')
      const listSessionsOperation = vaultTeller.listSessions(null)
      await expect(listSessionsOperation).rejects.toThrow('Unauthorized: Session id is required')
    })

    test('throws "Unauthorized" error if the session id is not found in the session store', async () => {
      vaultStore = createVaultStore()
      const vaultTeller = new VaultTeller(vaultStore, sessionStore, encryptionService)
      await vaultTeller.initializeVault('passphrase')
      await vaultTeller.unlockVault('passphrase')
      const listSessionsOperation = vaultTeller.listSessions('not-found')
      await expect(listSessionsOperation).rejects.toThrow('Unauthorized: Session id not found')
    })

    test('throws "Unauthorized" error if the session id is found in the session store but is invalid', async () => {
      vaultStore = createVaultStore()
      const clock = sinon.useFakeTimers();
      const vaultTeller = new VaultTeller(vaultStore, sessionStore, encryptionService)
      await vaultTeller.initializeVault('passphrase')
      await vaultTeller.unlockVault('passphrase')
      const session = await vaultTeller.authorizeExternal(exampleExternalAccessRequest)
      clock.tick(exampleExternalAccessRequest.maxAge * 1000 + 1)
      const listSessionsOperation = vaultTeller.listSessions(session.id)
      await expect(listSessionsOperation).rejects.toThrow('Unauthorized: Session is invalid')
      clock.restore()
    })

    test('throws "Unauthorized" error if the session id is found in the session store but "session:list" is not allowed', async () => {
      vaultStore = createVaultStore()
      const vaultTeller = new VaultTeller(vaultStore, sessionStore, encryptionService)
      await vaultTeller.initializeVault('passphrase')
      await vaultTeller.unlockVault('passphrase')
      const session = await vaultTeller.authorizeExternal(exampleExternalAccessRequest)
      const listSessionsOperation = vaultTeller.listSessions(session.id)
      await expect(listSessionsOperation).rejects.toThrow('Unauthorized: Session is not allowed to perform this operation')
    })

    test('returns a list of sessions if the session id is found in the session store and is valid', async () => {
      vaultStore = createVaultStore()
      const vaultTeller = new VaultTeller(vaultStore, sessionStore, encryptionService)
      await vaultTeller.initializeVault('passphrase')
      const session = await vaultTeller.unlockVault('passphrase')
      const listSessions = await vaultTeller.listSessions(session.id)
      expect(listSessions).toEqual([session])
    })
  })

  describe('revokeSession', () => {
    test('throws "Unauthorized" error if the session id is not provided', async () => {
      vaultStore = createVaultStore()
      const vaultTeller = new VaultTeller(vaultStore, sessionStore, encryptionService)
      await vaultTeller.initializeVault('passphrase')
      await vaultTeller.unlockVault('passphrase')
      const listSessionsOperation = vaultTeller.revokeSession(null, null)
      await expect(listSessionsOperation).rejects.toThrow('Unauthorized: Session id is required')
    })

    test('throws "Unauthorized" error if the session id is not found in the session store', async () => {
      vaultStore = createVaultStore()
      const vaultTeller = new VaultTeller(vaultStore, sessionStore, encryptionService)
      await vaultTeller.initializeVault('passphrase')
      await vaultTeller.unlockVault('passphrase')
      const listSessionsOperation = vaultTeller.revokeSession('not-found', null)
      await expect(listSessionsOperation).rejects.toThrow('Unauthorized: Session id not found')
    })

    test('throws "Unauthorized" error if the session id is found in the session store but is invalid', async () => {
      vaultStore = createVaultStore()
      const clock = sinon.useFakeTimers();
      const vaultTeller = new VaultTeller(vaultStore, sessionStore, encryptionService)
      await vaultTeller.initializeVault('passphrase')
      await vaultTeller.unlockVault('passphrase')
      const session = await vaultTeller.authorizeExternal(exampleExternalAccessRequest)
      clock.tick(exampleExternalAccessRequest.maxAge * 1000 + 1)
      const listSessionsOperation = vaultTeller.revokeSession(session.id, null)
      await expect(listSessionsOperation).rejects.toThrow('Unauthorized: Session is invalid')
      clock.restore()
    })

    test('throws "Unauthorized" error if the session id is found in the session store but "session:revoke" is not allowed', async () => {
      vaultStore = createVaultStore()
      const vaultTeller = new VaultTeller(vaultStore, sessionStore, encryptionService)
      await vaultTeller.initializeVault('passphrase')
      await vaultTeller.unlockVault('passphrase')
      const session = await vaultTeller.authorizeExternal(exampleExternalAccessRequest)
      const listSessionsOperation = vaultTeller.revokeSession(session.id, null)
      await expect(listSessionsOperation).rejects.toThrow('Unauthorized: Session is not allowed to perform this operation')
    })

    test('successfully revokes the session if the session id is found in the session store and is valid', async () => {
      vaultStore = createVaultStore()
      const vaultTeller = new VaultTeller(vaultStore, sessionStore, encryptionService)
      await vaultTeller.initializeVault('passphrase')
      const ownerSession = await vaultTeller.unlockVault('passphrase')
      const externalSession = await vaultTeller.authorizeExternal(exampleExternalAccessRequest)
      const sessionsBeforeRevoke = await vaultTeller.listSessions(ownerSession.id)
      expect(sessionsBeforeRevoke).toEqual([ownerSession, externalSession])
      await vaultTeller.revokeSession(ownerSession.id, externalSession.id)
      const sessionsAfterRevoke = await vaultTeller.listSessions(ownerSession.id)
      const expectedRevokedSession = sessionsAfterRevoke.find(s => s.id === externalSession.id)
      expect(expectedRevokedSession.isValid()).toBe(false);
      expect(expectedRevokedSession.invalidatedAt).not.toBe(null);
      expect(expectedRevokedSession.invalidatedAt).closeTo(Date.now(), 1000);
    })
  })
}
