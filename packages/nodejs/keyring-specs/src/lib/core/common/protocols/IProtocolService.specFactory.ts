import {afterAll, afterEach, beforeAll, beforeEach, describe, expect, test} from "vitest";
import {
  Asset,
  Passphrase,
  IProtocolService,
  Network,
  AccountReference,
  ArgumentError,
  NetworkRequestError, SupportedProtocols,
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

export interface IProtocolServiceSpecFactoryOptions<T extends SupportedProtocols> {
  asset: Asset
  network: Network<T>
  account: AccountReference
  accountImport: {
    privateKey: string
    publicKey: string
    address: string
  }
}

export default <T extends SupportedProtocols>(TProtocolServiceCreator: () => IProtocolService<T>, options: IProtocolServiceSpecFactoryOptions<T>) => {
  const {asset, network: exampleNetwork} = options
  let protocolService: IProtocolService<T>
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

  describe('getBalance - (Native)', () => {
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
      const mockServer = new MockServerFactory(exampleNetwork);
      const server = mockServer.addSuccessfulQueryBalanceHandler().buildServer();

      beforeAll(() => server.listen());

      afterEach(() => server.resetHandlers());

      afterAll(() => server.close());

      test('returns the balance of the account', async () => {
        const balance = await protocolService.getBalance(exampleAccountRef, exampleNetwork)
        expect(balance).toBe(200)
      })
    })

    describe('Unsuccessful requests', () => {
      const mockServer = new MockServerFactory(exampleNetwork);
      const server = mockServer.addFailedQueryBalanceHandler().buildServer();

      beforeAll(() => server.listen());

      afterEach(() => server.resetHandlers());

      afterAll(() => server.close());

      test('throws a request error if request fails', () => {
        return expect(protocolService.getBalance(exampleAccountRef, exampleNetwork)).rejects.toThrow(NetworkRequestError)
      })
    })
  })

  describe('updateNetworkStatus', () => {
    describe('validations', () => {
      test('throws if undefined is provided', () => {
        // @ts-ignore
        return expect(protocolService.getNetworkStatus(undefined)).rejects.toThrow(ArgumentError);
      })

      test('throws if null is provided', () => {
        // @ts-ignore
        return expect(protocolService.getNetworkStatus(null)).rejects.toThrow(ArgumentError);
      })

      test('throws if an invalid network is provided', () => {
        return expect(protocolService.getNetworkStatus({} as Network<T>)).rejects.toThrow(ArgumentError);
      })
    })

    describe('Successful requests', () => {
      const mockServer = new MockServerFactory(exampleNetwork);
      const server =
          mockServer
            .addSuccessfulQueryFeeHandler()
            .addSuccessfulQueryBalanceHandler()
            .addSendTransactionHandler()
            .buildServer();

      beforeAll(() => server.listen());

      afterEach(() => server.resetHandlers());

      afterAll(() => server.close());

      test('updates the fee status', async () => {
        const status = await protocolService.getNetworkStatus(exampleNetwork)
        expect(status.canProvideFee).toBe(true)
        expect(status.feeStatusLastUpdated).toBeDefined()
        expect(status.feeStatusLastUpdated).closeTo(Date.now(), 1000)
      })

      test('updates the balance status', async () => {
        const status = await protocolService.getNetworkStatus(exampleNetwork)
        expect(status.canProvideBalance).toBe(true)
        expect(status.balanceStatusLastUpdated).toBeDefined()
        expect(status.balanceStatusLastUpdated).closeTo(Date.now(), 1000)
      })

      test('updates the send transaction status', async () => {
        const status = await protocolService.getNetworkStatus(exampleNetwork)
        expect(status.canSendTransaction).toBe(true)
        expect(status.sendTransactionStatusLastUpdated).toBeDefined()
        expect(status.sendTransactionStatusLastUpdated).closeTo(Date.now(), 1000)
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
