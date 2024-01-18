import sinon from 'sinon'
import {afterEach, beforeEach, describe, expect, test} from 'vitest'
import {
  AccountReference,
  Asset,
  ForbiddenSessionError,
  InvalidSessionError,
  PermissionsBuilder,
  Session,
  SupportedProtocols
} from "@poktscan/keyring";

describe('session', () => {
  let  clock: sinon.SinonFakeTimers

  beforeEach(() => {
    clock = sinon.useFakeTimers()
  })

  afterEach(() => {
    clock.restore()
  });

  describe('#constructor', () => {
    test('sets the session to expire in 1 hour by default', () => {
      const session = new Session({ permissions: []})
      expect(session.maxAge).toBe(3600)
    })

    test('sets the session to expire in the specified number of seconds', () => {
      const session = new Session({ permissions: [], maxAge: 2 })
      expect(session.maxAge).toBe(2)
    })

    test('fails if the maxAge is less than 0', () => {
      expect(() => new Session({ permissions: [], maxAge: -1 })).toThrow('maxAge must be greater than 0')
    })
  })

  describe('invalidate', () => {
    test('marks the session as invalidated', () => {
      const session = new Session({ permissions: []})
      expect(session.isValid()).toBe(true)
      session.invalidate()
      expect(session.isValid()).toBe(false)
    })

    test('sets the invalidatedAt timestamp', () => {
      const session = new Session({ permissions: []})
      expect(session.invalidatedAt).toBe(0)
      clock.tick(2000) // Simulate 2 seconds has passed
      session.invalidate()
      expect(session.invalidatedAt).not.toBe(0)
      expect(session.invalidatedAt).closeTo(Date.now(), 1000)
    })

    test('does not change the invalidatedAt timestamp if the session is already invalidated', () => {
      const session = new Session({ permissions: []})
      session.invalidate()
      const invalidatedAt = session.invalidatedAt
      clock.tick(2000) // Simulate 2 seconds has passed
      session.invalidate()
      expect(session.invalidatedAt).toBe(invalidatedAt)
    })
  })

  describe('isValid', () => {
    test('returns true if the session has not expired', () => {
      const session = new Session({ permissions: []}); // Create a session that expires in 1 hour
      expect(session.isValid()).toBe(true)
    })

    test('returns false if the session has expired', () => {
      const session = new Session({ permissions: [], maxAge: 2 })
      clock.tick(2000) // Simulate 2 seconds has passed
      expect(session.isValid()).toBe(false)
    })

    test('returns false if the session has been invalidated', () => {
      const session = new Session({ permissions: []})
      expect(session.isValid()).toBe(true)
      session.invalidate()
      expect(session.isValid()).toBe(false)
    })

    test('session does not expire when maxAge is zero', () => {
      const session = new Session({ permissions: [], maxAge: 0 })
      clock.tick(2000) // Simulate 2 seconds has passed
      expect(session.isValid()).toBe(true)
    });
  })

  describe('lastActivity', () => {
    test('defaults to the time of creation', () => {
      const session = new Session({ permissions: []})
      expect(session.lastActivity).closeTo(Date.now(), 100)
    })
  })

  describe('updateLastActivity', () => {
    test('updates the lastActivity timestamp', () => {
      const session = new Session({ permissions: []})
      const lastActivity = session.lastActivity
      clock.tick(2000) // Simulate 2 seconds has passed
      session.updateLastActivity()
      expect(session.lastActivity).toBeGreaterThan(lastActivity)
      expect(session.lastActivity).closeTo(Date.now(), 100)
    })

    test('throws an error timestamp if the session is invalidated', () => {
      const session = new Session({ permissions: []})
      session.invalidate()
      expect(() => session.updateLastActivity()).toThrow(new InvalidSessionError())
    })
  })

  describe('addAccount', () => {
    const asset: Asset = new Asset({
      name: 'Test Asset',
      symbol: 'TST',
      isNative: true,
      protocol: SupportedProtocols.Pocket
    });

    const exampleAccountReference: AccountReference
      = new AccountReference('123', 'Testnet Account','0x32344', asset.protocol)

    const permissions =
      new PermissionsBuilder()
        .forResource('account')
        .allowEverything()
        .andBuild();

    test('throws unauthorized error if the session is invalidated', () => {
      const session = new Session({ permissions: []})
      session.invalidate()
      expect(() => session.addAccount(exampleAccountReference)).toThrow(new InvalidSessionError())
    })

    test('throws unauthorized error if the session does not have account:create permissions', () => {
      const session = new Session({ permissions: []})
      expect(() => session.addAccount(exampleAccountReference)).toThrow(new ForbiddenSessionError())
    })

    test('when the session has account:create permissions, adds the account to the list of permission resources', () => {
      const session = new Session({ permissions })

      expect(session.permissions).toEqual(permissions)

      session.addAccount(exampleAccountReference)

      const permissionsWithAccount =
        new PermissionsBuilder()
          .forResource('account')
          .allowEverything()
          .on(exampleAccountReference.id)
          .build();

      expect(permissionsWithAccount).toEqual(session.permissions)
    })
  })
})
