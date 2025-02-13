import { describe, test, expect } from 'vitest'
import { Permission, PermissionsBuilder } from '@soothe/vault'

describe('PermissionsBuilder', () => {
  test('Allows creating permissions for specific actions', () => {
    const expectedPermissions: Permission[] = [
      {
        resource: 'account',
        action: 'read',
        identities: ['*'],
      },
    ]

    const permissions =
      new PermissionsBuilder()
        .forResource('account')
        .allow('read')
        .onAny()
        .build()

    expect(permissions).toEqual(expectedPermissions)
  })
  test('Allows creating permissions for all actions on a given resource', () => {
    const expectedPermissions: Permission[] = [
      {
        resource: 'account',
        action: 'create',
        identities: ['*'],
      },
      {
        resource: 'account',
        action: 'read',
        identities: ['*'],
      },
      {
        resource: 'account',
        action: 'update',
        identities: ['*'],
      },
      {
        resource: 'account',
        action: 'delete',
        identities: ['*'],
      },
    ]

    const permissions =
      new PermissionsBuilder()
        .forResource('account')
        .allowEverything()
        .onAny()
        .build()

    expect(permissions).toEqual(expectedPermissions)
  })
  test('Allows creating permissions for specific identities', () => {
    const expectedPermissions: Permission[] = [
      {
        resource: 'account',
        action: 'read',
        identities: ['0x1234'],
      },
    ]

    const permissions =
      new PermissionsBuilder()
        .forResource('account')
        .allow('read')
        .on('0x1234')
        .build()

    expect(permissions).toEqual(expectedPermissions)
  })
  test('Allows creating permissions for multiple identities', () => {
    const expectedPermissions: Permission[] = [
      {
        resource: 'account',
        action: 'read',
        identities: ['0x1234', '0x5678'],
      },
    ]

    const permissions =
      new PermissionsBuilder()
        .forResource('account')
        .allow('read')
        .on('0x1234', '0x5678')
        .build()

    expect(permissions).toEqual(expectedPermissions)
  })
  test('allows extending a list of permissions with a new resource', () => {
    const initialPermissions: Permission[] = [
      {
        resource: 'account',
        action: 'read',
        identities: ['*'],
      },
      {
        resource: 'transaction',
        action: 'sign',
        identities: ['*'],
      },
    ]

    const expectedPermissions: Permission[] = [
      ...initialPermissions,
      {
        resource: 'session',
        action: 'revoke',
        identities: ['*'],
      },
    ]

    const permissions =
      new PermissionsBuilder(initialPermissions)
        .forResource('session')
        .allow('revoke')
        .onAny()
        .build()

    expect(permissions).toEqual(expectedPermissions)
  })
  test('allows extending a list of permissions with a pre-existing resource', () => {
    const sessionResource: Permission = {
      resource: 'session',
      action: 'revoke',
      identities: ['123'],
    }

    const basePermissions: Permission[] = [
      {
        resource: 'account',
        action: 'read',
        identities: ['*'],
      },
      {
        resource: 'transaction',
        action: 'sign',
        identities: ['*'],
      },
    ]

    const initialPermissions: Permission[] = [
      ...basePermissions,
      { ...sessionResource },
    ]

    const expectedPermissions: Permission[] = [
      ...basePermissions,
      {
        ...sessionResource,
        identities: ['123', '1234'],
      },
    ]

    const permissions =
      new PermissionsBuilder(initialPermissions)
        .forResource('session')
        .allow('revoke')
        .on('1234')
        .build()

    expect(permissions).toEqual(expectedPermissions)
  })
  test('Fails when creating permissions for unknown actions', () => {
    expect(() => {
      new PermissionsBuilder()
        .forResource('account')
        .allow('read', 'unknown')
        .onAny()
        .build()
    }).toThrow('Unknown actions: unknown for resource account')
  })
  test('Fails and list all unknown actions when creating', () => {
    expect(() => {
      new PermissionsBuilder()
        .forResource('account')
        .allow('read', 'unknown', 'anotherUnknown')
        .onAny()
        .build()
    }).toThrow('Unknown actions: unknown, anotherUnknown for resource account')
  })
  test('Fails when creating permissions for unknown resources', () => {
    expect(() => {
      new PermissionsBuilder()
        // @ts-ignore
        .forResource('unknownResource')
        .allow('read')
        .onAny()
        .build()
    }).toThrow('Unknown resource: unknownResource')
  })
})
