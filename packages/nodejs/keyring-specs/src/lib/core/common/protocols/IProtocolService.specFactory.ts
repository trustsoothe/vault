import {afterAll, afterEach, beforeAll, beforeEach, describe, expect, test} from "vitest";
import {
  Asset,
  Passphrase,
  IProtocolService,
  Network,
  PocketNetworkProtocol,
  AccountReference,
  ArgumentError,
  NetworkRequestError,
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

export default <T extends IProtocolService>(TProtocolServiceCreator: () => T, asset: Asset) => {
  let protocolService: T
  const passphrase = new Passphrase('passphrase')
  const pocketTestnet: Network = new Network({
    name: 'test',
    rpcUrl: 'http://localhost:8080',
    protocol: new PocketNetworkProtocol('testnet'),
  })

  beforeEach(() => {
    protocolService = TProtocolServiceCreator()
  })

  describe('Account Creation and Import', () => {
    const examplePrivateKey = 'f0f18c7494262c805ddb2ce6dc2cc89970c22687872e8b514d133fafc260e43d49b7b82f1aec833f854da378d6658246475d3774bd323d70b098015c2b5ae6db'
    const expectedPublicKey = '49b7b82f1aec833f854da378d6658246475d3774bd323d70b098015c2b5ae6db';
    const expectedAddress = '30fd308b3bf2126030aba7f0e342dcb8b4922a8b';

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

    describe('createAccountFromPrivateKey', () => {
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
        const account = await protocolService.createAccountFromPrivateKey({ asset, passphrase, privateKey: examplePrivateKey })
        expect(account).toBeDefined()
        expect(account.publicKey).toBe(expectedPublicKey)
      })

      test('derives the correct address for the account', async () => {
        const account = await protocolService.createAccountFromPrivateKey({ asset, passphrase, privateKey: examplePrivateKey })
        expect(account).toBeDefined()
        expect(account.address).toBe(expectedAddress)
      })

      test('encrypts the private key with the passphrase', async () => {
        const account = await protocolService.createAccountFromPrivateKey({ asset, passphrase, privateKey: examplePrivateKey })
        expect(account).toBeDefined()
        expect(account.privateKey).not.toBe(examplePrivateKey)
      })
    })
  });

  describe('getBalance', () => {
    const exampleAccountRef =
      new AccountReference(
        'account-id',
        'test-account',
        'test-address',
        new PocketNetworkProtocol('testnet')
      );

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
      const server = MockServerFactory.getSuccessMockServer(pocketTestnet)

      beforeAll(() => server.listen());

      afterEach(() => server.resetHandlers());

      afterAll(() => server.close());

      test('returns the balance of the account', async () => {
        const balance = await protocolService.getBalance(pocketTestnet, exampleAccountRef)
        expect(balance).toBe(200)
      })
    })

    describe('Unsuccessful requests', () => {
      const server = MockServerFactory.getFailureMockServer(pocketTestnet)

      beforeAll(() => server.listen());

      afterEach(() => server.resetHandlers());

      afterAll(() => server.close());

      test('throws a request error if request fails', () => {
        return expect(protocolService.getBalance(pocketTestnet, exampleAccountRef)).rejects.toThrow(NetworkRequestError)
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
        const server = MockServerFactory.getSuccessMockServer(pocketTestnet)

        beforeAll(() => server.listen());

        afterEach(() => server.resetHandlers());

        afterAll(() => server.close());

        test('returns the fee of the network', async () => {
          const fee = await protocolService.getFee(pocketTestnet)
          expect(fee).toBe(0.01)
        })
      })

      describe('Unsuccessful requests', () => {
        const server = MockServerFactory.getFailureMockServer(pocketTestnet)

        beforeAll(() => server.listen());

        afterEach(() => server.resetHandlers());

        afterAll(() => server.close());

        test('throws a request error if request fails', () => {
          return expect(protocolService.getFee(pocketTestnet)).rejects.toThrow(NetworkRequestError)
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
      const server = MockServerFactory.getSuccessMockServer(pocketTestnet)

      beforeAll(() => server.listen());

      afterEach(() => server.resetHandlers());

      afterAll(() => server.close());

      test('updates the fee status', async () => {
        const network = await protocolService.updateNetworkStatus(pocketTestnet)
        expect(network.status.canProvideFee).toBe(true)
        expect(network.status.feeStatusLastUpdated).toBeDefined()
        expect(network.status.feeStatusLastUpdated).closeTo(Date.now(), 1000)
      })

      test('updates the balance status', async () => {
        const network = await protocolService.updateNetworkStatus(pocketTestnet)
        expect(network.status.canProvideBalance).toBe(true)
        expect(network.status.balanceStatusLastUpdated).toBeDefined()
        expect(network.status.balanceStatusLastUpdated).closeTo(Date.now(), 1000)
      })

      test('updates the send transaction status', async () => {
        const network = await protocolService.updateNetworkStatus(pocketTestnet)
        expect(network.status.canSendTransaction).toBe(true)
        expect(network.status.sendTransactionStatusLastUpdated).toBeDefined()
        expect(network.status.sendTransactionStatusLastUpdated).closeTo(Date.now(), 1000)
      })
    })
  })
}
