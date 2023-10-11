import {afterAll, afterEach, beforeAll, beforeEach, describe, expect, test} from "vitest";
import {
  Asset,
  Passphrase,
  IProtocolService,
  Network,
  AccountReference,
  ArgumentError,
  NetworkRequestError,
  Protocol,
} from "@poktscan/keyring";
import { webcrypto } from 'node:crypto';
import {MockServerFactory} from "../../../../mocks/mock-server-factory";

/**
 * This workaround is required by the '@noble/ed25519' library. See: https://github.com/paulmillr/noble-ed25519#usage
 * node.js 18 and earlier,  needs globalThis.crypto polyfill
 */
// @ts-ignore
if (!globalThis.crypto) {
  // @ts-ignore
  globalThis.crypto = webcrypto;
}

export interface IProtocolServiceSpecFactoryOptions {
  asset: Asset
  network: Network
  account: AccountReference
  accountImport: {
    privateKey: string
    publicKey: string
    address: string
  }
}

export default <T extends IProtocolService<Protocol>>(TProtocolServiceCreator: () => T, options: IProtocolServiceSpecFactoryOptions) => {
  const {asset, network: exampleNetwork} = options
  let protocolService: T
  const passphrase = new Passphrase('passphrase')

  beforeEach(() => {
    protocolService = TProtocolServiceCreator()
  })

  describe('createAccount', () => {
    test('throws if an asset instance is not provided', async () => {
      // @ts-ignore
      await expect(protocolService.createAccount({ asset: undefined, passphrase })).rejects.toThrow(ArgumentError)
    })

    test('throws if a passphrase is not provided', async () => {
      // @ts-ignore
      await expect(protocolService.createAccount({ asset, passphrase: undefined })).rejects.toThrow(ArgumentError)
    })

    describe('new random accounts generations', () => {
      test('creates a new random account using the asset.', async () => {
        const account = await protocolService.createAccount({ asset, passphrase })
        expect(account).toBeDefined()
        expect(account.address).toBeDefined()
        expect(account.publicKey).toBeDefined()
        expect(account.privateKey).toBeDefined()
      })
    })
  })

  describe('getBalance', () => {
    const {account: exampleAccountRef} = options

    describe('validations', () => {
      test('throws if undefined is provided as the network', () => {
        // @ts-ignore
        return expect(protocolService.getBalance(undefined, exampleAccountRef)).rejects.toThrow(ArgumentError);
      })

      test('throws if null is provided as the network', () => {
        // @ts-ignore
        return expect(protocolService.getBalance(null, exampleAccountRef)).rejects.toThrow(ArgumentError);
      })

      test('throws if non Network object is provided as the network', () => {
        // @ts-ignore
        return expect(protocolService.getBalance({}, exampleAccountRef)).rejects.toThrow(ArgumentError);
      })
    })

    describe('Successful requests', () => {
      const server = MockServerFactory.getSuccessMockServer(exampleNetwork)

      beforeAll(() => server.listen());

      afterEach(() => server.resetHandlers());

      afterAll(() => server.close());

      test('returns the balance of the account', async () => {
        const balance = await protocolService.getBalance(exampleNetwork, exampleAccountRef)
        expect(balance).toBe(200)
      })
    })

    describe('Unsuccessful requests', () => {
      const server = MockServerFactory.getFailureMockServer(exampleNetwork)

      beforeAll(() => server.listen());

      afterEach(() => server.resetHandlers());

      afterAll(() => server.close());

      test('throws a request error if request fails', () => {
        return expect(protocolService.getBalance(exampleNetwork, exampleAccountRef)).rejects.toThrow(NetworkRequestError)
      })
    })
  })

  describe('getFee', () => {
      describe('validations', () => {
        test('throws if undefined is provided as the network', () => {
          // @ts-ignore
          return expect(protocolService.getFee(undefined)).rejects.toThrow(ArgumentError);
        })

        test('throws if null is provided as the network', () => {
          // @ts-ignore
          return expect(protocolService.getFee(null)).rejects.toThrow(ArgumentError);
        })

        test('throws if non Network object is provided as the network', () => {
          // @ts-ignore
          return expect(protocolService.getFee({})).rejects.toThrow(ArgumentError);
        })
      })

      describe('Successful requests', () => {
        const server = MockServerFactory.getSuccessMockServer(exampleNetwork)

        beforeAll(() => server.listen());

        afterEach(() => server.resetHandlers());

        afterAll(() => server.close());

        test('returns the fee of the network', async () => {
          const fee = await protocolService.getFee(exampleNetwork)
          expect(fee).toBe(0.01)
        })
      })

      describe('Unsuccessful requests', () => {
        const server = MockServerFactory.getFailureMockServer(exampleNetwork)

        beforeAll(() => server.listen());

        afterEach(() => server.resetHandlers());

        afterAll(() => server.close());

        test('throws a request error if request fails', () => {
          return expect(protocolService.getFee(exampleNetwork)).rejects.toThrow(NetworkRequestError)
        })
      })
  })

  describe('updateNetworkStatus', () => {
    describe('validations', () => {
      test('throws if undefined is provided', () => {
        // @ts-ignore
        return expect(protocolService.updateNetworkStatus(undefined)).rejects.toThrow(ArgumentError);
      })

      test('throws if null is provided', () => {
        // @ts-ignore
        return expect(protocolService.updateNetworkStatus(null)).rejects.toThrow(ArgumentError);
      })

      test('throws if an invalid network is provided', () => {
        return expect(protocolService.updateNetworkStatus({} as Network)).rejects.toThrow(ArgumentError);
      })
    })

    describe('Successful requests', () => {
      const server = MockServerFactory.getSuccessMockServer(exampleNetwork)

      beforeAll(() => server.listen());

      afterEach(() => server.resetHandlers());

      afterAll(() => server.close());

      test('updates the fee status', async () => {
        const network = await protocolService.updateNetworkStatus(exampleNetwork)
        expect(network.status.canProvideFee).toBe(true)
        expect(network.status.feeStatusLastUpdated).toBeDefined()
        expect(network.status.feeStatusLastUpdated).closeTo(Date.now(), 1000)
      })

      test('updates the balance status', async () => {
        const network = await protocolService.updateNetworkStatus(exampleNetwork)
        expect(network.status.canProvideBalance).toBe(true)
        expect(network.status.balanceStatusLastUpdated).toBeDefined()
        expect(network.status.balanceStatusLastUpdated).closeTo(Date.now(), 1000)
      })

      test('updates the send transaction status', async () => {
        const network = await protocolService.updateNetworkStatus(exampleNetwork)
        expect(network.status.canSendTransaction).toBe(true)
        expect(network.status.sendTransactionStatusLastUpdated).toBeDefined()
        expect(network.status.sendTransactionStatusLastUpdated).closeTo(Date.now(), 1000)
      })
    })
  })

  describe('createAccountFromPrivateKey', () => {
    const {accountImport} = options
    test('throws if an asset instance is not provided', async () => {
      // @ts-ignore
      await expect(protocolService.createAccountFromPrivateKey({ asset: undefined, passphrase })).rejects.toThrow(ArgumentError)
    })

    test('throws if a passphrase is not provided', async () => {
      // @ts-ignore
      await expect(protocolService.createAccountFromPrivateKey({ asset, passphrase: undefined })).rejects.toThrow(ArgumentError)
    })

    test('throws if a private key is not provided', async () => {
      // @ts-ignore
      await expect(protocolService.createAccountFromPrivateKey({ asset, passphrase, privateKey: undefined })).rejects.toThrow(ArgumentError)
    })

    test('derives the correct public key for the account', async () => {
      const account = await protocolService.createAccountFromPrivateKey({ asset, passphrase, privateKey: accountImport.privateKey })
      expect(account).toBeDefined()
      expect(account.publicKey).toBe(accountImport.publicKey)
    })

    test('derives the correct address for the account', async () => {
      const account = await protocolService.createAccountFromPrivateKey({ asset, passphrase, privateKey: accountImport.privateKey })
      expect(account).toBeDefined()
      expect(account.address).toBe(accountImport.address)
    })

    test('encrypts the private key with the passphrase', async () => {
      const account = await protocolService.createAccountFromPrivateKey({ asset, passphrase, privateKey: accountImport.privateKey })
      expect(account).toBeDefined()
      expect(account.privateKey).not.toBe(accountImport.privateKey)
    })
  })
}
