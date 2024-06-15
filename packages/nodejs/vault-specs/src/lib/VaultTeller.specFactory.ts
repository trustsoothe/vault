import {
  Account,
  AccountExistError,
  AccountNotFoundError,
  AccountOptions,
  AccountReference, AccountType, ArgumentError,
  Asset, EncryptedVault,
  ExternalAccessRequest,
  ForbiddenSessionError,
  IEncryptionService,
  InvalidPrivateKeyError,
  IStorage,
  IVaultStore,
  Network,
  OriginReference,
  Passphrase,
  Permission,
  PermissionsBuilder,
  PrivateKeyRestoreError,
  RecoveryPhraseError, RecoveryPhraseExistError, RecoveryPhraseNotFoundError,
  SerializedSession,
  Session,
  SessionIdRequiredError,
  SupportedProtocols,
  SupportedTransferDestinations,
  SupportedTransferOrigins, Vault,
  VaultIsLockedError,
  VaultRestoreError,
  VaultTeller,
  VaultUninitializedError,
} from '@poktscan/vault'
import {afterEach, beforeAll, beforeEach, describe, expect, test} from 'vitest'
import sinon from 'sinon'
import {v4} from "uuid";

export default <
  TEncryptionService extends IEncryptionService,
  TSessionStore extends IStorage<SerializedSession>,
  TVaultStore extends IVaultStore>(
  TVaultStoreCreator: { new(): TVaultStore } | (() => TVaultStore),
  TSessionStoreCreator: { new(): TSessionStore } | (() => IStorage<SerializedSession>),
  TEncryptionServiceCreator: { new(): TEncryptionService } | (() => TEncryptionService)
) => {

  let vaultStore: TVaultStore
  let sessionStore: TSessionStore
  let encryptionService: TEncryptionService
  const exampleOriginReference: OriginReference = new OriginReference('https://example.com')
  let unspecifiedNetworkAsset: Asset
  let exampleAccount: Account
  let exampleExternalPermissions: Permission[]
  let exampleExternalAccessRequest: ExternalAccessRequest

  const pocketAsset = new Asset({
    name: 'Example Asset',
    protocol: SupportedProtocols.Pocket,
    symbol: 'POKT'
  });

  function isConstructor<T>(creator: { new(): T } | (() => T)) {
    return !!creator && !!creator.prototype && !!creator.prototype.constructor
  }

  function createVaultStore(): TVaultStore {
    return isConstructor<TVaultStore>(TVaultStoreCreator)
      // @ts-ignore
      ? new TVaultStoreCreator()
      // @ts-ignore
      : TVaultStoreCreator()
  }

  beforeEach(() => {
    encryptionService =
      isConstructor<TEncryptionService>(TEncryptionServiceCreator)
        // @ts-ignore
        ? new TEncryptionServiceCreator()
        // @ts-ignore
        : TEncryptionServiceCreator()

    unspecifiedNetworkAsset = new Asset({
      name: 'Example Asset',
      protocol: SupportedProtocols.Pocket,
      symbol: 'EXM'
    })

    const options: AccountOptions = {
      publicKey: '1234',
      privateKey: '1234',
      address: 'derived-address',
      protocol: unspecifiedNetworkAsset.protocol,
      secure: false,
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
    test('throws an error if the vault store is not initialized', async () => {
      vaultStore = createVaultStore()
      sinon.stub(vaultStore, 'get').returns(null)
      const vaultTeller = new VaultTeller(vaultStore, sessionStore, encryptionService)
      const authorizeOwnerOperation = vaultTeller.unlockVault('passphrase')
      await expect(authorizeOwnerOperation).rejects.toThrow(VaultUninitializedError);
    })

    test('throws an error if the passed passphrase is null or empty', async () => {
      const vaultTeller = new VaultTeller(vaultStore, sessionStore, encryptionService)
      // @ts-ignore
      const authorizeOwnerOperation = vaultTeller.unlockVault(null)
      await expect(authorizeOwnerOperation).rejects.toThrow('Passphrase cannot be null or empty')
    })

    test('throws an error if the provided passphrase is incorrect', async () => {
      vaultStore = createVaultStore()
      const vaultTeller = new VaultTeller(vaultStore, sessionStore, encryptionService)
      await vaultTeller.initializeVault('passphrase')
      const authorizeOwnerOperation = vaultTeller.unlockVault('wrong-passphrase')
      await expect(authorizeOwnerOperation).rejects.toThrow(VaultRestoreError)
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

      test('persists the newly created session', async () => {
        vaultStore = createVaultStore()
        const vaultTeller = new VaultTeller(vaultStore, sessionStore, encryptionService)
        await vaultTeller.initializeVault('passphrase')
        const session = await vaultTeller.unlockVault('passphrase')
        const serializedSession = await sessionStore.getById(session.id)
        expect(serializedSession, 'Session was not found').not.toBeNull()
        const persistedSession = Session.deserialize(serializedSession!)
        expect(persistedSession).toStrictEqual(session)
      })

      test('newly created session has all permissions for the account resource', async () => {
        vaultStore = createVaultStore()
        const vaultTeller = new VaultTeller(vaultStore, sessionStore, encryptionService)
        await vaultTeller.initializeVault('passphrase')
        const {permissions} = await vaultTeller.unlockVault('passphrase')
        const expectedPermissions
          = new PermissionsBuilder().forResource('account').allowEverything().onAny().build()
        expect(permissions).toEqual(expect.arrayContaining(expectedPermissions))
      })

      test('newly created session has all permissions for the transaction resource', async () => {
        vaultStore = createVaultStore()
        const vaultTeller = new VaultTeller(vaultStore, sessionStore, encryptionService)
        await vaultTeller.initializeVault('passphrase')
        const {permissions} = await vaultTeller.unlockVault('passphrase')
        const expectedPermissions
          = new PermissionsBuilder().forResource('transaction').allowEverything().onAny().build()
        expect(permissions).toEqual(expect.arrayContaining(expectedPermissions))
      })

      test('newly created session has all permissions for the session resource', async () => {
        vaultStore = createVaultStore()
        const vaultTeller = new VaultTeller(vaultStore, sessionStore, encryptionService)
        await vaultTeller.initializeVault('passphrase')
        const {permissions} = await vaultTeller.unlockVault('passphrase')
        const expectedPermissions
          = new PermissionsBuilder().forResource('session').allowEverything().onAny().build()
        expect(permissions).toEqual(expect.arrayContaining(expectedPermissions))
      })

      test('sets the provided "sessionMaxAge"', async () => {
        vaultStore = createVaultStore()
        const vaultTeller = new VaultTeller(vaultStore, sessionStore, encryptionService)
        await vaultTeller.initializeVault('passphrase')
        const {maxAge} = await vaultTeller.unlockVault('passphrase', {
          sessionMaxAge: 2,
        })
        expect(maxAge).toEqual(2);
      });
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
      // @ts-ignore
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
        const {permissions, id} = await vaultTeller.authorizeExternal(exampleExternalAccessRequest)
        expect(permissions).toEqual([
          ...exampleExternalPermissions,
          /*
            * The following permissions are added by the VaultTeller: session:revoke:{id}
           */
          {
            action: 'revoke',
            resource: 'session',
            identities: [id],
          },
        ])
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
        const expectedSession = Session.deserialize(persistedSession!)
        expect(session).toEqual(expectedSession)
      })
    })
  })

  describe('lockVault', () => {
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
      // @ts-ignore
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
      // @ts-ignore
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
      // @ts-ignore
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
      // @ts-ignore
      const listSessionsOperation = vaultTeller.revokeSession(null, null)
      await expect(listSessionsOperation).rejects.toThrow('Unauthorized: Session id is required')
    })

    test('throws "Unauthorized" error if the session id is not found in the session store', async () => {
      vaultStore = createVaultStore()
      const vaultTeller = new VaultTeller(vaultStore, sessionStore, encryptionService)
      await vaultTeller.initializeVault('passphrase')
      await vaultTeller.unlockVault('passphrase')
      // @ts-ignore
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
      // @ts-ignore
      const listSessionsOperation = vaultTeller.revokeSession(session.id, null)
      await expect(listSessionsOperation).rejects.toThrow('Unauthorized: Session is invalid')
      clock.restore()
    })

    test('throws "Unauthorized" error if the session id is found in the session store but "session:revoke" is not allowed', async () => {
      vaultStore = createVaultStore()

      const externalAccessRequestWithoutDefaults = new ExternalAccessRequest(
        exampleExternalAccessRequest.permissions as Permission[],
        exampleExternalAccessRequest.maxAge,
        exampleExternalAccessRequest.origin,
        exampleExternalAccessRequest.accounts as AccountReference[],
        false
      )

      const vaultTeller = new VaultTeller(vaultStore, sessionStore, encryptionService)
      await vaultTeller.initializeVault('passphrase')
      await vaultTeller.unlockVault('passphrase')
      const session = await vaultTeller.authorizeExternal(externalAccessRequestWithoutDefaults)
      // @ts-ignore
      const listSessionsOperation = vaultTeller.revokeSession(session.id, null)
      await expect(listSessionsOperation).rejects.toThrow('Unauthorized: Session is not allowed to perform this operation')
    })

    test('successfully revokes the session if the session id is found in the session store and is valid', async () => {
      vaultStore = createVaultStore()
      const vaultTeller = new VaultTeller(vaultStore, sessionStore!, encryptionService!)
      await vaultTeller.initializeVault('passphrase')
      const ownerSession = await vaultTeller.unlockVault('passphrase')
      const externalSession = await vaultTeller.authorizeExternal(exampleExternalAccessRequest)
      const sessionsBeforeRevoke = await vaultTeller.listSessions(ownerSession.id)
      expect(sessionsBeforeRevoke).toEqual([ownerSession, externalSession])
      await vaultTeller.revokeSession(ownerSession.id, externalSession.id)
      const sessionsAfterRevoke = await vaultTeller.listSessions(ownerSession.id)
      const expectedRevokedSession = sessionsAfterRevoke.find(s => s.id === externalSession.id)
      expect(expectedRevokedSession?.isValid()).toBe(false);
      expect(expectedRevokedSession?.invalidatedAt).not.toBe(null);
      expect(expectedRevokedSession?.invalidatedAt).closeTo(Date.now(), 1000);
    })
  })

  describe('removeAccount', () => {
    test('throws "SessionIdRequiredError" error if the session id is not provided', async () => {
      vaultStore = createVaultStore()
      const vaultTeller = new VaultTeller(vaultStore, sessionStore!, encryptionService!)
      await vaultTeller.initializeVault('passphrase')
      await vaultTeller.unlockVault('passphrase')
      const passphrase = new Passphrase('passphrase');
      // @ts-ignore
      const createAccountOperation = vaultTeller.removeAccount(null, passphrase, null);

      await expect(createAccountOperation).rejects.toThrow(SessionIdRequiredError)
    })

    test('throws "VaultRestoreError" if the vault passphrase is not provided or incorrect', async () => {
      vaultStore = createVaultStore()
      const vaultTeller = new VaultTeller(vaultStore, sessionStore!, encryptionService!)
      await vaultTeller.initializeVault('passphrase')
      const session = await vaultTeller.unlockVault('passphrase')
      // @ts-ignore
      const createAccountOperation = vaultTeller.removeAccount(session.id, null, null);

      await expect(createAccountOperation).rejects.toThrow(VaultRestoreError)
    })

    test('throws "ForbiddenSessionError" if the session id is found in the session store but "account:delete" is not allowed', async () => {
      const { vaultTeller, session, passphrase } = await initializePermissionLessVault()
      // @ts-ignore
      const createAccountOperation = vaultTeller.removeAccount(session.id, passphrase, null)

      await expect(createAccountOperation).rejects.toThrow(ForbiddenSessionError)
    });

    describe('when the account is found in the vault', () => {
      const passphrase = new Passphrase('passphrase')

      test('removes the account from the vault', async () => {
        vaultStore = createVaultStore()
        const vaultTeller = new VaultTeller(vaultStore, sessionStore!, encryptionService!)
        await vaultTeller.initializeVault(passphrase.get())
        const session = await vaultTeller.unlockVault(passphrase.get())
        const account = await vaultTeller.createAccount(session.id, passphrase, {
          name: 'example-account',
          protocol: pocketAsset.protocol,
          passphrase,
        });
        const accounts = await vaultTeller.listAccounts(session.id)
        expect(accounts).toEqual([account])

        await vaultTeller.removeAccount(session.id, passphrase, account);

        const accountsAfterRemoval = await vaultTeller.listAccounts(session.id)
        expect(accountsAfterRemoval).toEqual([])
      })
    })
  })

  describe('transactions', () => {
    describe('transferFunds', () => {
      test('throws "SessionIdRequiredError" error if the session id is not provided', async () => {
        vaultStore = createVaultStore()
        const vaultTeller = new VaultTeller(vaultStore, sessionStore!, encryptionService!)
        await vaultTeller.initializeVault('passphrase')
        await vaultTeller.unlockVault('passphrase')
        // @ts-ignore
        const transferFundsOperation = vaultTeller.transferFunds(null, null);

        await expect(transferFundsOperation).rejects.toThrow(SessionIdRequiredError)
      })

      test('throws "ForbiddenSessionError" if the session id is found in the session store but "transaction:send" is not allowed', async () => {
        vaultStore = createVaultStore()
        const externalAccessRequestWithoutDefaults = new ExternalAccessRequest(
          exampleExternalAccessRequest.permissions as Permission[],
          exampleExternalAccessRequest.maxAge,
          exampleExternalAccessRequest.origin,
          exampleExternalAccessRequest.accounts as AccountReference[],
          false
        )

        const vaultTeller = new VaultTeller(vaultStore, sessionStore!, encryptionService!)
        await vaultTeller.initializeVault('passphrase')
        await vaultTeller.unlockVault('passphrase')
        const session = await vaultTeller.authorizeExternal(externalAccessRequestWithoutDefaults)
        // @ts-ignore
        const transferFundsOperation = vaultTeller.transferFunds(session.id, null)

        await expect(transferFundsOperation).rejects.toThrow(ForbiddenSessionError)
      })

      describe(`when the transfer origin is ${SupportedTransferOrigins.RawPrivateKey}`, () => {
        test('throws "InvalidPrivateKeyError" if the private key is not a valid (Pocket Network)', async () => {
          vaultStore = createVaultStore()
          const vaultTeller = new VaultTeller(vaultStore, sessionStore!, encryptionService!)
          await vaultTeller.initializeVault('passphrase')
          const session = await vaultTeller.unlockVault('passphrase')
          const transferFundsOperation = vaultTeller.transferFunds(session.id, {
            from: {
              type: SupportedTransferOrigins.RawPrivateKey,
              value: '0x0000000000000000000000000000000000000000000000000000000000000000',
            },
            to: {
              type: SupportedTransferDestinations.RawAddress,
              value: 'some-address',
            },
            amount: 200,
            network: new Network<SupportedProtocols.Pocket>({
              name: 'Example POKT Testnet Network',
              protocol: SupportedProtocols.Pocket,
              rpcUrl: 'https://example.com',
              chainID: 'testnet',
            }),
            // @ts-ignore
            transactionParams: {},
          })

          await expect(transferFundsOperation).rejects.toThrow(InvalidPrivateKeyError)
        })
      })

      describe(`when the transfer origin is ${SupportedTransferOrigins.VaultAccountId}`, () => {
        test('throws "ArgumentError" when the transfer origin value is not a valid id', async () => {
          vaultStore = createVaultStore()
          const vaultTeller = new VaultTeller(vaultStore, sessionStore!, encryptionService!)
          await vaultTeller.initializeVault('passphrase')
          const session = await vaultTeller.unlockVault('passphrase')
          const transferFundsOperation = vaultTeller.transferFunds(session.id, {
            from: {
              type: SupportedTransferOrigins.VaultAccountId,
              value: 'invalid-id', // not a uuid
            },
            to: {
              type: SupportedTransferDestinations.RawAddress,
              value: 'some-address',
            },
            amount: 200,
            network: new Network<SupportedProtocols.Pocket>({
              name: 'Example POKT Testnet Network',
              protocol: SupportedProtocols.Pocket,
              rpcUrl: 'https://example.com',
              chainID: 'testnet',
            }),
            // @ts-ignore
            transactionParams: {},
          })

          await expect(transferFundsOperation).rejects.toThrow(/^.*from\.value.*$/);
        })

        /**
         * With the latest changes related to removing the account specific passphrase, we need to re-evaluate the need for this spec.
         */
        test.skip('throws "ArgumentError" when the transfer origin passphrase is not valid', async () => {
          vaultStore = createVaultStore()
          const vaultTeller = new VaultTeller(vaultStore, sessionStore!, encryptionService!)
          await vaultTeller.initializeVault('passphrase')
          const session = await vaultTeller.unlockVault('passphrase');
          const transferFundsOperation = vaultTeller.transferFunds(session.id, {
            from: {
              type: SupportedTransferOrigins.VaultAccountId,
              value: 'a0276a66-8456-4ee5-8c08-35f4c4737353', // Not a real account but a valid id
              // passphrase is required
            },
            to: {
              type: SupportedTransferDestinations.RawAddress,
              value: 'some-address',
            },
            amount: 200,
            network: new Network<SupportedProtocols.Pocket>({
              name: 'Example POKT Testnet Network',
              protocol: SupportedProtocols.Pocket,
              rpcUrl: 'https://example.com',
              chainID: 'testnet',
            }),
            // @ts-ignore
            transactionParams: {},
          })

          await expect(transferFundsOperation).rejects.toThrow(/^.*from\.passphrase.*$/);
        })

        test('throws "AccountNotFoundError" if the account is not found in the vault', async () => {
          vaultStore = createVaultStore()
          const vaultTeller = new VaultTeller(vaultStore, sessionStore!, encryptionService!)
          await vaultTeller.initializeVault('passphrase')
          const session = await vaultTeller.unlockVault('passphrase')
          const transferFundsOperation = vaultTeller.transferFunds(session.id, {
            from: {
              type: SupportedTransferOrigins.VaultAccountId,
              value: 'bc43bf52-673d-4cf9-9ae2-1952e8e05a48',
              passphrase: 'passphrase',
            },
            to: {
              type: SupportedTransferDestinations.RawAddress,
              value: 'some-address',
            },
            amount: 200,
            network: new Network<SupportedProtocols.Pocket>({
              name: 'Example POKT Testnet Network',
              protocol: SupportedProtocols.Pocket,
              rpcUrl: 'https://example.com',
              chainID: 'testnet',
            }),
            // @ts-ignore
            transactionParams: {},
          })

          await expect(transferFundsOperation).rejects.toThrow(AccountNotFoundError)
        })

        test('throws "VaultIsLockedError" if the vault is locked', async () => {
          vaultStore = createVaultStore()
          const vaultTeller = new VaultTeller(vaultStore, sessionStore!, encryptionService!)
          await vaultTeller.initializeVault('passphrase')
          const session = await vaultTeller.unlockVault('passphrase')
          const account = await vaultTeller.createAccount(session.id, new Passphrase('passphrase'), {
            name: 'example-account',
            protocol: pocketAsset.protocol,
            passphrase: new Passphrase('passphrase'),
          })
          vaultTeller.lockVault()
          const transferFundsOperation = vaultTeller.transferFunds(session.id, {
            from: {
              type: SupportedTransferOrigins.VaultAccountId,
              value: account.id,
            },
            to: {
              type: SupportedTransferDestinations.RawAddress,
              value: 'some-address',
            },
            amount: 200,
            network: new Network<SupportedProtocols.Pocket>({
              name: 'Example POKT Testnet Network',
              protocol: SupportedProtocols.Pocket,
              rpcUrl: 'https://example.com',
              chainID: 'testnet',
            }),
            // @ts-ignore
            transactionParams: {},
          })

          await expect(transferFundsOperation).rejects.toThrow(VaultIsLockedError)
        })
      })
    })
  })

  const initializePermissionLessVault = async () => {
    vaultStore = createVaultStore()
    const externalAccessRequestWithoutDefaults = new ExternalAccessRequest(
      exampleExternalAccessRequest.permissions as Permission[],
      exampleExternalAccessRequest.maxAge,
      exampleExternalAccessRequest.origin,
      exampleExternalAccessRequest.accounts as AccountReference[],
      false
    )

    const vaultTeller = new VaultTeller(vaultStore, sessionStore!, encryptionService!)
    await vaultTeller.initializeVault('passphrase')
    await vaultTeller.unlockVault('passphrase')
    const session = await vaultTeller.authorizeExternal(externalAccessRequestWithoutDefaults)
    const passphrase = new Passphrase('passphrase');

    return {vaultTeller, session, passphrase};
  }

  const createVault = async () => {
    vaultStore = createVaultStore()
    const vaultTeller = new VaultTeller(vaultStore, sessionStore!, encryptionService!)
    await vaultTeller.initializeVault('passphrase')
    const session = await vaultTeller.unlockVault('passphrase')
    const passphrase = new Passphrase('passphrase')

    return {vaultTeller, session, passphrase};
  }

  describe('importRecoveryPhrase', () => {
    test('throws "SessionIdRequiredError" error if the session id is not provided', async () => {
      vaultStore = createVaultStore()
      const vaultTeller = new VaultTeller(vaultStore, sessionStore!, encryptionService!)
      await vaultTeller.initializeVault('passphrase')
      await vaultTeller.unlockVault('passphrase')
      const passphrase = new Passphrase('passphrase')
      // @ts-ignore
      const importRecoveryPhraseOperation = vaultTeller.importRecoveryPhrase(null, passphrase, {
        recoveryPhraseName: 'example-hd-wallet',
        recoveryPhrase: 'example invalid recovery phrase',
      })

      await expect(importRecoveryPhraseOperation).rejects.toThrow(SessionIdRequiredError)
    })

    test('throws "VaultRestoreError" if the vault passphrase is not provided or incorrect', async () => {
      vaultStore = createVaultStore()
      const vaultTeller = new VaultTeller(vaultStore, sessionStore!, encryptionService!)
      await vaultTeller.initializeVault('passphrase')
      const session = await vaultTeller.unlockVault('passphrase')
      // @ts-ignore
      const importRecoveryPhraseOperation = vaultTeller.importRecoveryPhrase(session.id, null, {
        recoveryPhraseName: 'example-hd-wallet',
        recoveryPhrase: vaultTeller.createRecoveryPhrase(),
      })

      await expect(importRecoveryPhraseOperation).rejects.toThrow(VaultRestoreError)
    })

    test('throws "ForbiddenSessionError" if the session id is found in the session store but "seed:create" is not allowed', async () => {
      const {vaultTeller, session, passphrase} = await initializePermissionLessVault();
      // @ts-ignore
      const importRecoveryPhraseOperation = vaultTeller.importRecoveryPhrase(session.id, passphrase, {
        recoveryPhraseName: 'example-hd-wallet',
        recoveryPhrase: 'example invalid recovery phrase',
      })

      await expect(importRecoveryPhraseOperation).rejects.toThrow(ForbiddenSessionError)
    });

    test('throws "RecoveryPhraseError" if the recovery phrase is not provided', async () => {
      vaultStore = createVaultStore()
      const vaultTeller = new VaultTeller(vaultStore, sessionStore!, encryptionService!)
      await vaultTeller.initializeVault('passphrase')
      const session = await vaultTeller.unlockVault('passphrase')
      const passphrase = new Passphrase('passphrase')

      // @ts-ignore
      const importRecoveryPhraseOperation = vaultTeller.importRecoveryPhrase(session.id, passphrase, {
        recoveryPhraseName: 'example-hd-wallet',
      })

      await expect(importRecoveryPhraseOperation).rejects.toThrow(/^.*(recovery|phrase).*$/g);
    });

    test('throws "RecoveryPhraseError" if the recovery phrase is not valid', async () => {
      vaultStore = createVaultStore()
      const vaultTeller = new VaultTeller(vaultStore, sessionStore!, encryptionService!)
      await vaultTeller.initializeVault('passphrase')
      const session = await vaultTeller.unlockVault('passphrase')
      const passphrase = new Passphrase('passphrase')

      const importRecoveryPhraseOperation = vaultTeller.importRecoveryPhrase(session.id, passphrase, {
        recoveryPhraseName: 'example-hd-wallet',
        recoveryPhrase: 'example invalid recovery phrase',
      })

      await expect(importRecoveryPhraseOperation).rejects.toThrow(RecoveryPhraseError)
    });

    describe('when the recovery phrase is valid', () => {
      test('resolves to the reference of the newly created recovery phrase', async () => {
        const {vaultTeller, session, passphrase} = await createVault();
        const newRecoveryPhrase = await vaultTeller.importRecoveryPhrase(session.id, passphrase, {
          recoveryPhrase: vaultTeller.createRecoveryPhrase(),
          recoveryPhraseName: 'example-hd-wallet',
        })

        expect(newRecoveryPhrase).toBeDefined()
        expect(newRecoveryPhrase.id).toBeDefined()
        expect(newRecoveryPhrase.name).toEqual('example-hd-wallet')
      });

      test('indicates if the newly created recovery phrase has a passphrase', async () => {
        const {vaultTeller, session, passphrase} = await createVault();
        const newRecoveryPhrase = await vaultTeller.importRecoveryPhrase(session.id, passphrase, {
          recoveryPhrase: vaultTeller.createRecoveryPhrase(),
          recoveryPhraseName: 'example-hd-wallet',
          passphrase: 'passphrase'
        })

        expect(newRecoveryPhrase.hasPassphrase).toEqual(true)
      })

      test('the newly created recoveryPhrase exists in the vault', async () => {
        const {vaultTeller, session, passphrase} = await createVault();
        const newRecoveryPhrase = await vaultTeller.importRecoveryPhrase(session.id, passphrase, {
          recoveryPhrase: vaultTeller.createRecoveryPhrase(),
          recoveryPhraseName: 'example-hd-wallet',
        })

        const recoveryPhrases = await vaultTeller.listRecoveryPhrases(session.id)

        expect(recoveryPhrases).toContainEqual(expect.objectContaining({
          id: newRecoveryPhrase.id,
        }))
      });

      test('throws "RecoveryPhraseExist" if a recovery phrase exists that matches phrase and passphrase', async () => {
        const {vaultTeller, session, passphrase} = await createVault();

        const recoveryPhrase = vaultTeller.createRecoveryPhrase()

        await vaultTeller.importRecoveryPhrase(session.id, passphrase, {
          recoveryPhrase,
          recoveryPhraseName: 'example-hd-wallet',
          passphrase: 'passphrase'
        })

        const importRecoveryPhraseOperation = vaultTeller.importRecoveryPhrase(session.id, passphrase, {
          recoveryPhrase,
          recoveryPhraseName: 'example-hd-wallet',
          passphrase: 'passphrase',
        })

        await expect(importRecoveryPhraseOperation).rejects.toThrow(RecoveryPhraseExistError)
      });
    });
  })

  describe('listRecoveryPhrases', () => {
    test('throws "SessionIdRequiredError" error if the session id is not provided', async () => {
      vaultStore = createVaultStore()
      const vaultTeller = new VaultTeller(vaultStore, sessionStore!, encryptionService!)
      await vaultTeller.initializeVault('passphrase')
      await vaultTeller.unlockVault('passphrase')
      const passphrase = new Passphrase('passphrase')
      // @ts-ignore
      const listRecoveryPhrasesOperation = vaultTeller.listRecoveryPhrases(null)

      await expect(listRecoveryPhrasesOperation).rejects.toThrow(SessionIdRequiredError)
    })

    test('throws "ForbiddenSessionError" if the session id is found in the session store but "seed:read" is not allowed', async () => {
      const {vaultTeller, session, passphrase} = await initializePermissionLessVault();
      // @ts-ignore
      const listRecoveryPhrasesOperation = vaultTeller.listRecoveryPhrases(session.id)

      await expect(listRecoveryPhrasesOperation).rejects.toThrow(ForbiddenSessionError)
    });

    test('returns a list of recovery phrases if the session id is found in the session store and is valid', async () => {
      const {vaultTeller, session, passphrase} = await createVault();

      const recoveryPhrase = await vaultTeller.importRecoveryPhrase(session.id, passphrase, {
        recoveryPhrase: vaultTeller.createRecoveryPhrase(),
        recoveryPhraseName: 'example-hd-wallet',
      })

      const recoveryPhrases = await vaultTeller.listRecoveryPhrases(session.id)

      expect(recoveryPhrases).toEqual([recoveryPhrase])
    })
  })

  describe('updateRecoveryPhrase', () => {
    test('throws "SessionIdRequiredError" error if the session id is not provided', async () => {
        vaultStore = createVaultStore()
        const vaultTeller = new VaultTeller(vaultStore, sessionStore!, encryptionService!)
        await vaultTeller.initializeVault('passphrase')
        await vaultTeller.unlockVault('passphrase')
        const passphrase = new Passphrase('passphrase')
        // @ts-ignore
        const updateRecoveryPhraseOperation = vaultTeller.updateRecoveryPhrase(null, passphrase, null);

        await expect(updateRecoveryPhraseOperation).rejects.toThrow(SessionIdRequiredError)
    });

    test('throws "VaultRestoreError" if the vault passphrase is not provided or incorrect', async () => {
        vaultStore = createVaultStore()
        const vaultTeller = new VaultTeller(vaultStore, sessionStore!, encryptionService!)
        await vaultTeller.initializeVault('passphrase')
        const session = await vaultTeller.unlockVault('passphrase')
        // @ts-ignore
        const updateRecoveryPhraseOperation = vaultTeller.updateRecoveryPhrase(session.id, null, null);

        await expect(updateRecoveryPhraseOperation).rejects.toThrow(VaultRestoreError)
    });

    test('throws "ForbiddenSessionError" if the session id is found in the session store but "seed:update" is not allowed', async () => {
        const {vaultTeller, session, passphrase} = await initializePermissionLessVault();
        // @ts-ignore
        const updateRecoveryPhraseOperation = vaultTeller.updateRecoveryPhrase(session.id, passphrase, null);

        await expect(updateRecoveryPhraseOperation).rejects.toThrow(ForbiddenSessionError)
    });

    test('throws "RecoveryPhraseNotFoundError" if the recovery phrase is not found in the vault', async () => {
        const {vaultTeller, session, passphrase} = await createVault();
        const updateRecoveryPhraseOperation = vaultTeller.updateRecoveryPhrase(session.id, passphrase, {
          recoveryPhraseId: 'recovery-phrase-id-that-does-not-exist',
        })

        await expect(updateRecoveryPhraseOperation).rejects.toThrow(RecoveryPhraseNotFoundError)
    });

    test('successfully updates the recovery phrase "name" attribute in the vault', async () => {
        const {vaultTeller, session, passphrase} = await createVault();
        const recoveryPhrase = await vaultTeller.importRecoveryPhrase(session.id, passphrase, {
          recoveryPhrase: vaultTeller.createRecoveryPhrase(),
          recoveryPhraseName: 'example-hd-wallet',
        })

        const updatedRecoveryPhrase = await vaultTeller.updateRecoveryPhrase(session.id, passphrase, {
          recoveryPhraseId: recoveryPhrase.id,
          name: 'updated-hd-wallet',
        })

        expect(updatedRecoveryPhrase.name).toEqual('updated-hd-wallet')
    });
  })

  describe('Account creation - Pocket Network', () => {
    const examplePrivateKey = 'f0f18c7494262c805ddb2ce6dc2cc89970c22687872e8b514d133fafc260e43d49b7b82f1aec833f854da378d6658246475d3774bd323d70b098015c2b5ae6db'
    const expectedAddress = '30fd308b3bf2126030aba7f0e342dcb8b4922a8b';

    async function createVaultAndImportAccountFromPK(skipEncryption: boolean = false) {
      const {vaultTeller, session: ownerSession, passphrase} = await createVault();
      const account = await vaultTeller.createAccountFromPrivateKey(ownerSession.id, passphrase, {
        name: 'example-account',
        protocol: pocketAsset.protocol,
        passphrase: skipEncryption ? undefined : passphrase,
        privateKey: examplePrivateKey,
      })
      return {passphrase, vaultTeller, ownerSession, account};
    }

    describe('createAccountFromPrivateKey', () => {
      test('throws "SessionIdRequiredError" error if the session id is not provided', async () => {
        vaultStore = createVaultStore()
        const vaultTeller = new VaultTeller(vaultStore, sessionStore!, encryptionService!)
        // @ts-ignore
        const createAccountOperation = vaultTeller.createAccountFromPrivateKey(null, null, null);

        await expect(createAccountOperation).rejects.toThrow(SessionIdRequiredError)
      })

      test('throws "ForbiddenSessionError" if the session id is found in the session store but "account:create" is not allowed', async () => {
        vaultStore = createVaultStore()
        const externalAccessRequestWithoutDefaults = new ExternalAccessRequest(
          exampleExternalAccessRequest.permissions as Permission[],
          exampleExternalAccessRequest.maxAge,
          exampleExternalAccessRequest.origin,
          exampleExternalAccessRequest.accounts as AccountReference[],
          false
        )

        const passphrase = new Passphrase('passphrase');
        const vaultTeller = new VaultTeller(vaultStore, sessionStore!, encryptionService!)
        await vaultTeller.initializeVault(passphrase.get())
        await vaultTeller.unlockVault(passphrase.get())
        const session = await vaultTeller.authorizeExternal(externalAccessRequestWithoutDefaults)
        // @ts-ignore
        const createAccountOperation = vaultTeller.createAccountFromPrivateKey(session.id, passphrase, {
          name: 'example-account',
          protocol: pocketAsset.protocol,
          passphrase,
          privateKey: examplePrivateKey,
        })

        await expect(createAccountOperation).rejects.toThrow(ForbiddenSessionError)
      })

      test('throws "VaultRestoreError" if the vault passphrase is not provided or incorrect', async () => {
        vaultStore = createVaultStore()
        const passphrase = new Passphrase('passphrase');
        const vaultTeller = new VaultTeller(vaultStore, sessionStore!, encryptionService!)
        await vaultTeller.initializeVault(passphrase.get())
        const session = await vaultTeller.unlockVault(passphrase.get())
        // @ts-ignore
        const createAccountOperation = vaultTeller.createAccountFromPrivateKey(session.id, null, {
          name: 'example-account',
          protocol: pocketAsset.protocol,
          passphrase,
          privateKey: examplePrivateKey,
        });

        await expect(createAccountOperation).rejects.toThrow(VaultRestoreError)
      })

      test('creates an account from a private key', async () => {
        const {account} = await createVaultAndImportAccountFromPK();
        expect(account.name).toEqual('example-account')
        expect(account.protocol).toEqual(pocketAsset.protocol)
        expect(account.address).toEqual(expectedAddress)
      })

      test('account is persisted in the vault', async () => {
        const {account, vaultTeller, ownerSession} = await createVaultAndImportAccountFromPK();
        const accounts = await vaultTeller.listAccounts(ownerSession.id)
        expect(accounts).toEqual([account])
      })

      test('throws "AccountExistsError" if the account already exists in the vault', async () => {
        const {vaultTeller, ownerSession, passphrase} = await createVaultAndImportAccountFromPK();

        const createAccountOperation = vaultTeller.createAccountFromPrivateKey(ownerSession.id, passphrase, {
          name: 'example-account',
          protocol: pocketAsset.protocol,
          passphrase,
          privateKey: examplePrivateKey,
        })

        await expect(createAccountOperation).rejects.toThrow(AccountExistError)
      })

      test('replaces the account if it already exists in the vault and "replace" is set to true', async () => {
        const {account, vaultTeller, ownerSession, passphrase} = await createVaultAndImportAccountFromPK();

        const accountWithSameName = await vaultTeller.createAccountFromPrivateKey(ownerSession.id, passphrase, {
          name: 'example-account',
          protocol: pocketAsset.protocol,
          passphrase,
          privateKey: examplePrivateKey,
        }, true)

        expect(accountWithSameName.name).toEqual(account.name)
        expect(accountWithSameName.address).toEqual(account.address)
        expect(accountWithSameName.protocol).toEqual(account.protocol)
      })
    })

    describe('createAccount', () => {
      test('throws "SessionIdRequiredError" error if the session id is not provided', async () => {
        vaultStore = createVaultStore()
        const vaultTeller = new VaultTeller(vaultStore, sessionStore!, encryptionService!)
        await vaultTeller.initializeVault('passphrase')
        await vaultTeller.unlockVault('passphrase')
        const passphrase = new Passphrase('passphrase');
        // @ts-ignore
        const createAccountOperation = vaultTeller.createAccount(null, passphrase, {
          name: 'example-account',
          passphrase,
        })

        await expect(createAccountOperation).rejects.toThrow(SessionIdRequiredError)
      })

      test('throws "VaultRestoreError" if the vault passphrase is not provided or incorrect', async () => {
        vaultStore = createVaultStore()
        const vaultTeller = new VaultTeller(vaultStore, sessionStore!, encryptionService!)
        await vaultTeller.initializeVault('passphrase')
        const session = await vaultTeller.unlockVault('passphrase')
        // @ts-ignore
        const createAccountOperation = vaultTeller.createAccount(session.id, null, {
          name: 'example-account',
          protocol: pocketAsset.protocol,
          passphrase: new Passphrase('passphrase'),
        })

        await expect(createAccountOperation).rejects.toThrow(VaultRestoreError)
      })

      test('throws "ForbiddenSessionError" if the session id is found in the session store but "account:create" is not allowed', async () => {
        vaultStore = createVaultStore()
        const externalAccessRequestWithoutDefaults = new ExternalAccessRequest(
          exampleExternalAccessRequest.permissions as Permission[],
          exampleExternalAccessRequest.maxAge,
          exampleExternalAccessRequest.origin,
          exampleExternalAccessRequest.accounts as AccountReference[],
          false
        )

        const vaultTeller = new VaultTeller(vaultStore, sessionStore!, encryptionService!)
        await vaultTeller.initializeVault('passphrase')
        await vaultTeller.unlockVault('passphrase')
        const session = await vaultTeller.authorizeExternal(externalAccessRequestWithoutDefaults)
        const passphrase = new Passphrase('passphrase');
        // @ts-ignore
        const createAccountOperation = vaultTeller.createAccount(session.id, passphrase, {
          name: 'example-account',
          protocol: pocketAsset.protocol,
          passphrase,
        })

        await expect(createAccountOperation).rejects.toThrow(ForbiddenSessionError)
      });

      test('successfully creates an account', async () => {
        vaultStore = createVaultStore()
        const vaultTeller = new VaultTeller(vaultStore, sessionStore!, encryptionService!)
        await vaultTeller.initializeVault('passphrase')
        const session = await vaultTeller.unlockVault('passphrase')
        const passphrase = new Passphrase('passphrase');
        const account = await vaultTeller.createAccount(session.id, passphrase, {
          name: 'example-account',
          protocol: pocketAsset.protocol,
          passphrase,
        })

        expect(account.name).toBe('example-account')
      })

      test('account can be listed immediately after creation', async () => {
        vaultStore = createVaultStore()
        const vaultTeller = new VaultTeller(vaultStore, sessionStore!, encryptionService!)
        await vaultTeller.initializeVault('passphrase')
        const session = await vaultTeller.unlockVault('passphrase')
        const passphrase = new Passphrase('passphrase');
        const account = await vaultTeller.createAccount(session.id, passphrase, {
          name: 'example-account',
          protocol: pocketAsset.protocol,
          passphrase,
        })

        const accounts = await vaultTeller.listAccounts(session.id)
        expect(accounts).toEqual([account])
      });
    })

    describe('deriveAccountFromPrivateKey', () => {
      test('resolves to an account derived from the private key', async () => {
        vaultStore = createVaultStore()
        const vaultTeller = new VaultTeller(vaultStore, sessionStore!, encryptionService!)
        const passphrase = new Passphrase('passphrase');
        await vaultTeller.initializeVault(passphrase.get())
        await vaultTeller.unlockVault(passphrase.get())
        const account = await vaultTeller.deriveAccountFromPrivateKey({
          name: 'example-account',
          protocol: pocketAsset.protocol,
          privateKey: examplePrivateKey,
        })

        expect(account.name).toEqual('example-account')
        expect(account.protocol).toEqual(pocketAsset.protocol)
        expect(account.address).toEqual(expectedAddress)
        expect(account.privateKey).toEqual(examplePrivateKey)
      })
      test('sets the "isSecure" attribute to false because is not encrypted', async () => {
        vaultStore = createVaultStore()
        const vaultTeller = new VaultTeller(vaultStore, sessionStore!, encryptionService!)
        const passphrase = new Passphrase('passphrase');
        await vaultTeller.initializeVault(passphrase.get())
        await vaultTeller.unlockVault(passphrase.get())
        const account = await vaultTeller.deriveAccountFromPrivateKey({
          name: 'example-account',
          protocol: pocketAsset.protocol,
          privateKey: examplePrivateKey,
        })

        expect(account.isSecure).toEqual(false);
      })
    })

    describe('getAccountPrivateKey', () => {
      test('throws "SessionIdRequiredError" error if the session id is not provided', async () => {
        vaultStore = createVaultStore()
        const vaultTeller = new VaultTeller(vaultStore, sessionStore!, encryptionService!)
        // @ts-ignore
        const getAccountPrivateKeyOperation = vaultTeller.getAccountPrivateKey(null, null, {id: 'fake'}, null)

        await expect(getAccountPrivateKeyOperation).rejects.toThrow(SessionIdRequiredError)
      })

      test('throws "VaultRestoreError" if the vault passphrase is not provided or incorrect', async () => {
        vaultStore = createVaultStore()
        const vaultTeller = new VaultTeller(vaultStore, sessionStore!, encryptionService!)
        const passphrase = new Passphrase('passphrase');
        await vaultTeller.initializeVault(passphrase.get())
        const session = await vaultTeller.unlockVault(passphrase.get())
        // @ts-ignore
        const getAccountPrivateKeyOperation = vaultTeller.getAccountPrivateKey(session.id, null, {id: 'fake'}, passphrase)

        await expect(getAccountPrivateKeyOperation).rejects.toThrow(VaultRestoreError)
      })

      test('throws "ForbiddenSessionError" if the session id is found in the session store but "account:read" is not allowed', async () => {
        vaultStore = createVaultStore()
        const passphrase = new Passphrase('passphrase');
        /**
         * This example has permissions for the example account id, but not for the one created during
         * this test.
         */
        const externalAccessRequestWithoutDefaults = new ExternalAccessRequest(
          exampleExternalAccessRequest.permissions as Permission[],
          exampleExternalAccessRequest.maxAge,
          exampleExternalAccessRequest.origin,
          exampleExternalAccessRequest.accounts as AccountReference[],
          false
        )

        const vaultTeller = new VaultTeller(vaultStore, sessionStore!, encryptionService!)
        await vaultTeller.initializeVault(passphrase.get())
        const ownerSession = await vaultTeller.unlockVault(passphrase.get())

        const newAccountOptions = {
          name: 'example-account',
          protocol: pocketAsset.protocol,
          passphrase,
          privateKey: examplePrivateKey,
        }

        const account = await vaultTeller.createAccountFromPrivateKey(ownerSession.id, passphrase, newAccountOptions)

        const notAuthorizedSession = await vaultTeller.authorizeExternal(externalAccessRequestWithoutDefaults)

        // @ts-ignore
        const getAccountPrivateKeyOperation =
          vaultTeller.getAccountPrivateKey(notAuthorizedSession.id, passphrase, account, passphrase)

        await expect(getAccountPrivateKeyOperation).rejects.toThrow(ForbiddenSessionError)
      })

      test('throws "AccountNotFoundError" if the account is not found in the vault', async () => {
        vaultStore = createVaultStore()
        const passphrase = new Passphrase('passphrase');
        const vaultTeller = new VaultTeller(vaultStore, sessionStore!, encryptionService!)
        await vaultTeller.initializeVault(passphrase.get())
        const session = await vaultTeller.unlockVault(passphrase.get())
        // @ts-ignore
        const getAccountPrivateKeyOperation = vaultTeller.getAccountPrivateKey(session.id, passphrase, {
          id: 'bc43bf52-673d-4cf9-9ae2-1952e8e05a48',
          name: 'example-account',
        }, passphrase)

        await expect(getAccountPrivateKeyOperation).rejects.toThrow(AccountNotFoundError)
      })

      test('throws "VaultIsLockedError" if the vault is locked', async () => {
        const {passphrase, vaultTeller, ownerSession, account} = await createVaultAndImportAccountFromPK();

        vaultTeller.lockVault()

        // @ts-ignore
        const getAccountPrivateKeyOperation = vaultTeller.getAccountPrivateKey(ownerSession.id, passphrase, account, passphrase)

        await expect(getAccountPrivateKeyOperation).rejects.toThrow(VaultIsLockedError)
      })

      describe('When account is secure', () => {
        test('throws "PrivateKeyRestoreError" if account passphrase is not provided or incorrect', async () => {
          const {passphrase, vaultTeller, ownerSession, account} = await createVaultAndImportAccountFromPK();

          // @ts-ignore
          const getAccountPrivateKeyOperationWithNoPassphrase = vaultTeller.getAccountPrivateKey(ownerSession.id, passphrase, account)
          const getAccountPrivateKeyOperationWithWrongPassphrase = vaultTeller.getAccountPrivateKey(ownerSession.id, passphrase, account, new Passphrase('wrong-passphrase'))

          await expect(getAccountPrivateKeyOperationWithNoPassphrase).rejects.toThrow(PrivateKeyRestoreError)
          await expect(getAccountPrivateKeyOperationWithWrongPassphrase).rejects.toThrow(PrivateKeyRestoreError)
        })

        test('returns the private key of the account', async () => {
          const {passphrase, vaultTeller, ownerSession, account} =
            await createVaultAndImportAccountFromPK();

          const privateKey = await vaultTeller.getAccountPrivateKey(ownerSession.id, passphrase, account, passphrase)

          expect(privateKey).toEqual(examplePrivateKey)
        })
      })

      describe('When account is not secure', () => {
        test('returns the private key of the account without the account password provided', async () => {
          const {passphrase, vaultTeller, ownerSession, account} =
            await createVaultAndImportAccountFromPK(true);

          const privateKey = await vaultTeller.getAccountPrivateKey(ownerSession.id, passphrase, account)

          expect(privateKey).toEqual(examplePrivateKey)
        })
      });
    });

    describe('recovery phrase', () => {

      const recoveryPhrase = 'eye mosquito square rigid snow youth horse pride feed stage enact hero'

      const expectedAddresses = [
        'ee1f2bbe3f1f3b8141377ef75857cbf6a1a3991b',
        '36414bb4d7d55453f015abd6545d9a5cbd39b9a2',
        'adcd47c81b4d4cd8e440e331742c55b50f4f233f',
        '38edaa0ab2929c3d2f789d870f000006e6171488',
      ]

      describe('addHDWalletAccount', () => {
        test('throws "SessionIdRequiredError" error if the session id is not provided', async () => {
          const {vaultTeller} = await createVault();
          // @ts-ignore
          const addHDWalletAccountOperation = vaultTeller.addHDWalletAccount(null, null, null)
          await expect(addHDWalletAccountOperation).rejects.toThrow(SessionIdRequiredError)
        });

        test('throws "VaultRestoreError" if the vault passphrase is not provided or incorrect', async () => {
          const {vaultTeller, session, passphrase} = await createVault();

          const newRecoveryPhrase = await vaultTeller.importRecoveryPhrase(session.id, passphrase, {
            recoveryPhrase: vaultTeller.createRecoveryPhrase(),
            recoveryPhraseName: 'example-hd-wallet',
          })

          // @ts-ignore
          const addHDWalletAccountOperation = vaultTeller.addHDWalletAccount(session.id, null, {
            recoveryPhraseId: newRecoveryPhrase.id,
            protocol: SupportedProtocols.Pocket,
          })

          await expect(addHDWalletAccountOperation).rejects.toThrow(VaultRestoreError)
        });

        test('throws an error when the recoveryPhrase does not exist in the vault', async () => {
          const {vaultTeller, session, passphrase} = await createVault();

          const addHDWalletAccountOperation = vaultTeller.addHDWalletAccount(session.id, passphrase, {
            recoveryPhraseId: 'fake',
            protocol: SupportedProtocols.Pocket,
          })

          await expect(addHDWalletAccountOperation).rejects.toThrow(RecoveryPhraseNotFoundError)
        });

        test('defaults to 1 account', async () => {
          const {vaultTeller, session, passphrase} = await createVault();
          const newRecoveryPhrase = await vaultTeller.importRecoveryPhrase(session.id, passphrase, {
            recoveryPhrase: vaultTeller.createRecoveryPhrase(),
            recoveryPhraseName: 'example-hd-wallet',
          })

          const hdChildren = await vaultTeller.addHDWalletAccount(session.id, passphrase, {
            recoveryPhraseId: newRecoveryPhrase.id,
            protocol: SupportedProtocols.Pocket,
          })

          expect(hdChildren.length).toEqual(1)
        });

        test('allows to specify the number of accounts', async () => {
          const {vaultTeller, session, passphrase} = await createVault();
          const newRecoceryPhrase = await vaultTeller.importRecoveryPhrase(session.id, passphrase, {
            recoveryPhrase: vaultTeller.createRecoveryPhrase(),
            recoveryPhraseName: 'example-hd-wallet',
          })

          const hdChildren = await vaultTeller.addHDWalletAccount(session.id, passphrase, {
            recoveryPhraseId: newRecoceryPhrase.id,
            protocol: SupportedProtocols.Pocket,
            count: 3,
          })

          expect(hdChildren.length).toEqual(3)
        });

        test('resolves to the predictable list of new HDChild account references (address verification)', async () => {
          const {vaultTeller, session, passphrase} = await createVault();
          const newRecoveryPhrase = await vaultTeller.importRecoveryPhrase(session.id, passphrase, {
            recoveryPhrase,
            recoveryPhraseName: 'example-hd-wallet',
          });

          const hdChildren = await vaultTeller.addHDWalletAccount(session.id, passphrase, {
            recoveryPhraseId: newRecoveryPhrase.id,
            protocol: SupportedProtocols.Pocket,
            isSendNodes: true,
            count: 4,
          });

          const generatedAddresses = hdChildren.map((a) => a.address);

          expect(generatedAddresses).toEqual(expectedAddresses);
        });

        test('persists new HDChild account references in the vault', async () => {
          const {vaultTeller, session, passphrase} = await createVault();
          const newRecoveryPhrase = await vaultTeller.importRecoveryPhrase(session.id, passphrase, {
            recoveryPhrase: vaultTeller.createRecoveryPhrase(),
            recoveryPhraseName: 'example-hd-wallet',
          });

          const [secondChild] = await vaultTeller.addHDWalletAccount(session.id, passphrase, {
            recoveryPhraseId: newRecoveryPhrase.id,
            protocol: SupportedProtocols.Pocket,
          });

          const persistentAccounts = await vaultTeller.listAccounts(session.id);

          expect(persistentAccounts).toContainEqual(secondChild);
        });

        test('selects first available index for HDChild account when there is a gap', async () => {
          const {vaultTeller, session, passphrase} = await createVault();
          const newRecoveryPhrase = await vaultTeller.importRecoveryPhrase(session.id, passphrase, {
            recoveryPhrase: vaultTeller.createRecoveryPhrase(),
            recoveryPhraseName: 'example-hd-wallet',
          });

          // First child was created as part of the seed import
          const [firstChild, secondChild] = await vaultTeller.addHDWalletAccount(session.id, passphrase, {
            recoveryPhraseId: newRecoveryPhrase.id,
            protocol: SupportedProtocols.Pocket,
            count: 4,
          });

          await vaultTeller.removeAccount(session.id, passphrase, secondChild);

          const [newChild] = await vaultTeller.addHDWalletAccount(session.id, passphrase, {
            recoveryPhraseId: newRecoveryPhrase.id,
            protocol: SupportedProtocols.Pocket,
            count: 1,
          });

          // The new child is expected to get have the index of the second child (1) which we removed
          expect(newChild.hdwIndex).toEqual(1);
        });

        test('selects the next available index for HDChild account in sequence when there are no gaps', async () => {
          const {vaultTeller, session, passphrase} = await createVault();
          const newRecoveryPhrase = await vaultTeller.importRecoveryPhrase(session.id, passphrase, {
            recoveryPhrase: vaultTeller.createRecoveryPhrase(),
            recoveryPhraseName: 'example-hd-wallet',
          });

          const [firstChild] = await vaultTeller.addHDWalletAccount(session.id, passphrase, {
            recoveryPhraseId: newRecoveryPhrase.id,
            protocol: SupportedProtocols.Pocket,
            count: 1,
          });

          const [secondChild] = await vaultTeller.addHDWalletAccount(session.id, passphrase, {
            recoveryPhraseId: newRecoveryPhrase.id,
            protocol: SupportedProtocols.Pocket,
            count: 1,
          });

          const expectedIndex = firstChild?.hdwIndex! + 1;

          expect(secondChild?.hdwIndex).toBe(expectedIndex);
        });
      })
    });
  })

  describe('Account creation - Ethereum', () => {
    describe('recovery phrase', () => {
      const recoveryPhrase = 'enrich news velvet left upon pilot deer abandon view success brass want blame easy emotion'

      const expectedAddresses = [
        '0x1d9e7479f9B59a7887D090B82F0191A091a7013e',
        '0x44fd26AD2dAB06Ae377d5316810669e7b2bF137B',
        '0x3e3F7b82A0767fbA936B42E70F01274667fa4837',
        '0xb201cdaA3815741691f52027384c9a8A21Beb7ca',
      ]

      describe('addHDWalletAccount', () => {
        test('throws "SessionIdRequiredError" error if the session id is not provided', async () => {
          const {vaultTeller} = await createVault();
          // @ts-ignore
          const addHDWalletAccountOperation = vaultTeller.addHDWalletAccount(null, null, null)
          await expect(addHDWalletAccountOperation).rejects.toThrow(SessionIdRequiredError)
        });

        test('throws "VaultRestoreError" if the vault passphrase is not provided or incorrect', async () => {
          const {vaultTeller, session, passphrase} = await createVault();

          const newRecoveryPhrase = await vaultTeller.importRecoveryPhrase(session.id, passphrase, {
            recoveryPhrase: vaultTeller.createRecoveryPhrase(),
            recoveryPhraseName: 'example-hd-wallet',
          })

          // @ts-ignore
          const addHDWalletAccountOperation = vaultTeller.addHDWalletAccount(session.id, null, {
            recoveryPhraseId: newRecoveryPhrase.id,
            protocol: SupportedProtocols.Ethereum,
          })

          await expect(addHDWalletAccountOperation).rejects.toThrow(VaultRestoreError)
        });

        test('throws an error when the seed account does not exist in the vault', async () => {
          const {vaultTeller, session, passphrase} = await createVault();

          const addHDWalletAccountOperation = vaultTeller.addHDWalletAccount(session.id, passphrase, {
            recoveryPhraseId: 'fake',
            protocol: SupportedProtocols.Ethereum,
          })

          await expect(addHDWalletAccountOperation).rejects.toThrow(RecoveryPhraseNotFoundError)
        });

        test('defaults to 1 account', async () => {
          const {vaultTeller, session, passphrase} = await createVault();
          const newRecoveryPhrase = await vaultTeller.importRecoveryPhrase(session.id, passphrase, {
            recoveryPhrase: vaultTeller.createRecoveryPhrase(),
            recoveryPhraseName: 'example-hd-wallet',
          })

          const hdChildren = await vaultTeller.addHDWalletAccount(session.id, passphrase, {
            recoveryPhraseId: newRecoveryPhrase.id,
            protocol: SupportedProtocols.Ethereum,
          })

          expect(hdChildren.length).toEqual(1)
        });

        test('allows to specify the number of accounts', async () => {
          const {vaultTeller, session, passphrase} = await createVault();
          const newRecoveryPhrase = await vaultTeller.importRecoveryPhrase(session.id, passphrase, {
            recoveryPhrase: vaultTeller.createRecoveryPhrase(),
            recoveryPhraseName: 'example-hd-wallet',
          })

          const hdChildren = await vaultTeller.addHDWalletAccount(session.id, passphrase, {
            recoveryPhraseId: newRecoveryPhrase.id,
            protocol: SupportedProtocols.Ethereum,
            count: 3,
          })

          expect(hdChildren.length).toEqual(3)
        });

        test('resolves to the predictable list of new HDChild account references (address verification)', async () => {
          const {vaultTeller, session, passphrase} = await createVault();
          const newRecoveryPhrase = await vaultTeller.importRecoveryPhrase(session.id, passphrase, {
            recoveryPhrase,
            recoveryPhraseName: 'example-hd-wallet',
          });

          const hdChildren = await vaultTeller.addHDWalletAccount(session.id, passphrase, {
            recoveryPhraseId: newRecoveryPhrase.id,
            protocol: SupportedProtocols.Ethereum,
            count: 4,
          });

          const generatedAddresses = hdChildren.map((a) => a.address);

            expect(generatedAddresses).toEqual(expectedAddresses);
        });

        test('persists new HDChild account references in the vault', async () => {
          const {vaultTeller, session, passphrase} = await createVault();
          const newRecoveryPhrase = await vaultTeller.importRecoveryPhrase(session.id, passphrase, {
            recoveryPhrase: vaultTeller.createRecoveryPhrase(),
            recoveryPhraseName: 'example-hd-wallet',
          });

          const [secondChild] = await vaultTeller.addHDWalletAccount(session.id, passphrase, {
            recoveryPhraseId: newRecoveryPhrase.id,
            protocol: SupportedProtocols.Ethereum,
          });

          const persistentAccounts = await vaultTeller.listAccounts(session.id);

          expect(persistentAccounts).toContainEqual(secondChild);
        });

        test('selects first available index for HDChild account when there is a gap', async () => {
          const {vaultTeller, session, passphrase} = await createVault();
          const newRecoveryPhrase = await vaultTeller.importRecoveryPhrase(session.id, passphrase, {
            recoveryPhrase: vaultTeller.createRecoveryPhrase(),
            recoveryPhraseName: 'example-hd-wallet',
          });

          // First child was created as part of the seed import
          const [_, secondChild] = await vaultTeller.addHDWalletAccount(session.id, passphrase, {
            recoveryPhraseId: newRecoveryPhrase.id,
            protocol: SupportedProtocols.Ethereum,
            count: 4,
          });

          await vaultTeller.removeAccount(session.id, passphrase, secondChild);

          const [newChild] = await vaultTeller.addHDWalletAccount(session.id, passphrase, {
            recoveryPhraseId: newRecoveryPhrase.id,
            protocol: SupportedProtocols.Ethereum,
            count: 1,
          });

          // The new child is expected to get have the index of the second child (1) which we removed
          expect(newChild.hdwIndex).toEqual(1);
        });

        test('selects the next available index for HDChild account in sequence when there are no gaps', async () => {
          const {vaultTeller, session, passphrase} = await createVault();
          const newRecoveryPhrase = await vaultTeller.importRecoveryPhrase(session.id, passphrase, {
            recoveryPhrase: vaultTeller.createRecoveryPhrase(),
            recoveryPhraseName: 'example-hd-wallet',
          });

          const [firstChild] = await vaultTeller.addHDWalletAccount(session.id, passphrase, {
            recoveryPhraseId: newRecoveryPhrase.id,
            protocol: SupportedProtocols.Ethereum,
            count: 1,
          });

          const [secondChild] = await vaultTeller.addHDWalletAccount(session.id, passphrase, {
            recoveryPhraseId: newRecoveryPhrase.id,
            protocol: SupportedProtocols.Ethereum,
            count: 1,
          });

          const expectedIndex = firstChild?.hdwIndex! + 1;

          expect(secondChild?.hdwIndex).toBe(expectedIndex);
        });
      })
    });
  })

  describe('exportVault', () => {
    test('throws an error if the vault store is not initialized', async () => {
      vaultStore = createVaultStore()
      sinon.stub(vaultStore, 'get').resolves(null)
      const vaultTeller = new VaultTeller(vaultStore, sessionStore, encryptionService)
      const exportVaultOperation = vaultTeller.exportVault('passphrase')
      await expect(exportVaultOperation).rejects.toThrow(VaultUninitializedError);
    })

    test('throws an error if the passed passphrase is null or empty', async () => {
      vaultStore = createVaultStore()
      const vaultTeller = new VaultTeller(vaultStore, sessionStore, encryptionService)
      // @ts-ignore
      const nullPassphraseExportOperation = vaultTeller.exportVault(null)
      await expect(nullPassphraseExportOperation).rejects.toThrow('Passphrase cannot be null or empty')
      const emptyPassphraseExportOperation = vaultTeller.exportVault('')
      await expect(emptyPassphraseExportOperation).rejects.toThrow('Passphrase cannot be null or empty')
    })

    test('throws an error if the provided passphrase is incorrect', async () => {
      vaultStore = createVaultStore()
      const vaultTeller = new VaultTeller(vaultStore, sessionStore, encryptionService)
      await vaultTeller.initializeVault('passphrase')
      const incorrectPassphraseOperation = vaultTeller.exportVault('wrong-passphrase')
      await expect(incorrectPassphraseOperation).rejects.toThrow(VaultRestoreError)
    })

    test('returns the encryptedVault', async () => {
      const passphraseValue = 'passphrase'
      vaultStore = createVaultStore()
      const vaultTeller = new VaultTeller(vaultStore, sessionStore, encryptionService)
      await vaultTeller.initializeVault(passphraseValue)
      const encryptedVault = await vaultTeller.exportVault(passphraseValue)
      expect(encryptedVault).not.toBeNull();
      expect(encryptedVault).not.toBeUndefined();
    })

    describe('when new passphrase is provided', () => {
      test('encrypts the returned vault with the new passphrase', async () => {
        const passphraseValue = 'passphrase'
        const passphrase = new Passphrase(passphraseValue)
        const newPassphraseValue = 'new-passphrase'
        const newPassphrase = new Passphrase(newPassphraseValue);
        vaultStore = createVaultStore()
        const vaultTeller = new VaultTeller(vaultStore, sessionStore, encryptionService)
        await vaultTeller.initializeVault(passphraseValue)
        const encryptedVault = await vaultTeller.exportVault(passphraseValue, newPassphraseValue)

        const decryptWithNewPassphraseOperation = encryptionService.decrypt(newPassphrase, encryptedVault.contents);
        const decryptWithOldPassphraseOperation = encryptionService.decrypt(passphrase, encryptedVault.contents)

        expect(decryptWithNewPassphraseOperation).not.toThrow(VaultRestoreError)

        expect(decryptWithOldPassphraseOperation)
          .rejects.toThrow(/password/)
      })
    })

    describe('when no new passphrase is provided', () => {
      test('returns the encrypted vault with the current passphrase', async () => {
        const passphraseValue = 'passphrase'
        const passphrase = new Passphrase(passphraseValue)
        vaultStore = createVaultStore()
        const vaultTeller = new VaultTeller(vaultStore, sessionStore, encryptionService)
        await vaultTeller.initializeVault(passphraseValue)
        const encryptedVault = await vaultTeller.exportVault(passphraseValue)
        const decryptVaultOperation = encryptionService.decrypt(passphrase, encryptedVault.contents)
        await expect(decryptVaultOperation).resolves.not.toThrow(VaultRestoreError)
      })
    })
  })

  describe('importVault', () => {
    const getEncryptedVaultAndTeller = async (passphraseValue: string = 'passphrase') => {
      vaultStore = createVaultStore()
      const vaultTeller = new VaultTeller(vaultStore, sessionStore, encryptionService)
      await vaultTeller.initializeVault(passphraseValue)
      const encryptedVault = await vaultTeller.exportVault(passphraseValue)
      return {passphraseValue, encryptedVault, vaultStore, vaultTeller};
    }

    const decryptVault = async (
      passphrase: Passphrase,
      encryptedVault: EncryptedVault
    ): Promise<Vault> => {
      let vaultJson: string;

      try {
        vaultJson = await encryptionService.decrypt(
          passphrase,
          encryptedVault.contents
        );
      } catch (error) {
        throw new VaultRestoreError();
      }

      try {
        return Vault.deserialize(JSON.parse(vaultJson));
      } catch (error) {
        throw new Error(
          "Unable to deserialize vault. Has it been tempered with?"
        );
      }
    }

    test('throws an error if the provided vault is null or empty', async () => {
      vaultStore = createVaultStore()
      const vaultTeller = new VaultTeller(vaultStore, sessionStore, encryptionService)

      // @ts-ignore
      const importNullVaultOperation = vaultTeller.importVault(null, 'passphrase')

      // @ts-ignore
      const importUndefinedVaultOperation = vaultTeller.importVault(undefined, 'passphrase')

      await expect(importNullVaultOperation).rejects.toThrow(VaultRestoreError);
      await expect(importUndefinedVaultOperation).rejects.toThrow(VaultRestoreError);
    })

    test('throws an error if the passed passphrase is null or empty', async () => {
      const {encryptedVault, vaultTeller} = await getEncryptedVaultAndTeller()
      // @ts-ignore
      const importWithNullPassphraseOperation = vaultTeller.importVault(encryptedVault, null)
      const importWithEmptyPassphraseOperation = vaultTeller.importVault(encryptedVault, '')

      await expect(importWithNullPassphraseOperation).rejects.toThrow('Passphrase cannot be null or empty')
      await expect(importWithEmptyPassphraseOperation).rejects.toThrow('Passphrase cannot be null or empty')
    })

    test('throws an error if the provided passphrase is incorrect', async () => {
      const {encryptedVault, vaultTeller} = await getEncryptedVaultAndTeller()
      const wrongPassphraseImportOperation = vaultTeller.importVault(encryptedVault, 'wrong-passphrase')
      await expect(wrongPassphraseImportOperation).rejects.toThrow(VaultRestoreError)
    })

    test('replaces the existing vault - uses the file passphrase if none is provided', async () => {
      const {encryptedVault, vaultTeller, passphraseValue} = await getEncryptedVaultAndTeller()
      const passphrase = new Passphrase(passphraseValue)
      const originalVault = await decryptVault(passphrase, encryptedVault)
      await vaultTeller.importVault(encryptedVault, passphraseValue)
      const reImportedEncryptedVault = await vaultTeller.exportVault(passphraseValue);
      const reImportedVault = await decryptVault(passphrase, reImportedEncryptedVault)
      expect(originalVault.id).not.toEqual(reImportedVault.id)
    })

    describe('when a new passphrase is provided', () => {
      test('uses the new passphrase if one is provided', async () => {
        const {encryptedVault, vaultTeller, passphraseValue} = await getEncryptedVaultAndTeller()
        const passphrase = new Passphrase(passphraseValue)
        const newPassphraseValue = 'new-passphrase'
        await vaultTeller.importVault(encryptedVault, passphraseValue, newPassphraseValue)

        const exportWithOldPassphraseOperation = vaultTeller.exportVault(passphraseValue)
        const exportWithNewPassphraseOperation = vaultTeller.exportVault(newPassphraseValue)

        expect(exportWithOldPassphraseOperation).rejects.toThrow(VaultRestoreError)
        expect(exportWithNewPassphraseOperation).resolves
      })
    })
  })

  describe('createRecoveryPhrase', () => {
    test('defaults to 12 words', () => {
      vaultStore = createVaultStore()
      const vaultTeller = new VaultTeller(vaultStore, sessionStore, encryptionService)
      const recoveryPhrase = vaultTeller.createRecoveryPhrase()
      expect(recoveryPhrase.split(' ').length).toEqual(12)
    });

    test('allows to specify the number of words', () => {
      vaultStore = createVaultStore()
      const vaultTeller = new VaultTeller(vaultStore, sessionStore, encryptionService)
      const recoveryPhrase = vaultTeller.createRecoveryPhrase(24)
      expect(recoveryPhrase.split(' ').length).toEqual(24)
    });
  });

  describe('validateRecoveryPhrase', () => {
    test('resolves to false if the recovery phrase is not provided', () => {
      vaultStore = createVaultStore()
      const vaultTeller = new VaultTeller(vaultStore, sessionStore, encryptionService)
      // @ts-ignore
      const isValid = vaultTeller.validateRecoveryPhrase(null)
      expect(isValid).toBeFalsy()
    });

    test('resolves to false if the recovery phrase is not valid', () => {
      vaultStore = createVaultStore()
      const vaultTeller = new VaultTeller(vaultStore, sessionStore, encryptionService)
      const recoveryPhrase = 'invalid-recovery-phrase'
      const isValid = vaultTeller.validateRecoveryPhrase(recoveryPhrase)
      expect(isValid).toBeFalsy()
    });

    test('resolves to true if the recovery phrase is valid', () => {
      vaultStore = createVaultStore()
      const vaultTeller = new VaultTeller(vaultStore, sessionStore, encryptionService)
      const recoveryPhrase = vaultTeller.createRecoveryPhrase()
      const isValid = vaultTeller.validateRecoveryPhrase(recoveryPhrase)
      expect(isValid).toBeTruthy()
    });
  });
}
