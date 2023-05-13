import sinon from 'sinon'
import {describe, test, expect } from 'vitest'
import {Session} from "@poktscan/keyring";

describe('session', () => {
  describe('#constructor', () => {
    test('sets the session to expire in 1 hour by default', () => {
      const session = new Session([])
      expect(session.maxAge).toBe(3600)
    })

    test('sets the session to expire in the specified number of seconds', () => {
      const session = new Session([], 2)
      expect(session.maxAge).toBe(2)
    })

    test('fails if the maxAge is less than 0', () => {
      expect(() => new Session([], -1)).toThrow('maxAge must be greater than or equal to 0')
    })
  })

  describe('isValid', () => {
    test('returns true if the session has not expired', () => {
      const session = new Session([]); // Create a session that expires in 1 hour
      expect(session.isValid()).toBe(true)
    })

    test('returns false if the session has expired', () => {
      const clock = sinon.useFakeTimers()
      const session = new Session([], 2)
      clock.tick(2000) // Simulate 2 seconds has passed
      expect(session.isValid()).toBe(false)
      clock.restore()
    })

    test('always returns true when maxAge is 0', () => {
      const clock = sinon.useFakeTimers()
      const session = new Session([], 0)
      clock.tick(2000) // Simulate 2 seconds has passed
      expect(session.isValid()).toBe(true)
      clock.restore()
    })
  })
})
