import {afterAll, afterEach, beforeAll, beforeEach, describe, expect, test} from "vitest";
import {
  Asset,
  Passphrase,
  IProtocolService,
  Network,
  PocketNetworkProtocol
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

  beforeEach(() => {
    protocolService = TProtocolServiceCreator()
  })

  describe('createAccount', () => {
    test('throws if an asset instance is not provided', async () => {
      // @ts-ignore
      await expect(protocolService.createAccount({ asset: undefined, passphrase })).rejects.toThrow('Invalid Operation: Asset instance not provided')
    })

    test('throws if a passphrase is not provided', async () => {
      // @ts-ignore
      await expect(protocolService.createAccount({ asset, passphrase: undefined })).rejects.toThrow('Invalid Operation: Passphrase instance not provided')
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

  describe('updateNetworkStatus', () => {
    const pocketTestnet: Network = new Network({
      name: 'test',
      rpcUrl: 'http://localhost:8080',
      protocol: new PocketNetworkProtocol('testnet'),
    })

    describe('validations', () => {
      test('throws if undefined is provided', () => {
        // @ts-ignore
        return expect(protocolService.updateNetworkStatus(undefined)).rejects.toThrow('Invalid Argument: Network instance not provided');
      })

      test('throws if null is provided', () => {
        // @ts-ignore
        return expect(protocolService.updateNetworkStatus(null)).rejects.toThrow('Invalid Argument: Network instance not provided');
      })

      test('throws if an invalid network is provided', () => {
        return expect(protocolService.updateNetworkStatus({} as Network)).rejects.toThrow('Invalid Argument: Network instance not provided');
      })
    })

    describe('Successful requests', () => {
      const server = MockServerFactory.getMockServer(pocketTestnet)

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
