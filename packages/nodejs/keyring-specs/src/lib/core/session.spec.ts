import sinon from 'sinon'
import {describe, test, expect, beforeEach, afterEach} from 'vitest'
import {Session} from "@poktscan/keyring";

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
      expect(() => new Session({ permissions: [], maxAge: -1 })).toThrow('maxAge must be greater than or equal to 0')
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
      expect(session.invalidatedAt).toBeNull();
      session.invalidate()
      expect(session.invalidatedAt).not.toBeNull()
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

    test('always returns true when maxAge is 0', () => {
      const session = new Session({ permissions: [], maxAge: 0 })
      clock.tick(2000) // Simulate 2 seconds has passed
      expect(session.isValid()).toBe(true)
    })

    test('returns false if the session has been invalidated', () => {
      const session = new Session({ permissions: []})
      expect(session.isValid()).toBe(true)
      session.invalidate()
      expect(session.isValid()).toBe(false)
    })
  })
})
