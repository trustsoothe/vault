import {afterAll, afterEach, beforeAll, describe, expect, test} from "vitest";
import ProtocolServiceSpecFactory from '../IProtocolService.specFactory';
import {
  AccountReference,
  ArgumentError,
  IEncryptionService,
  INetwork,
  NetworkRequestError,
  PocketNetworkProtocolService,
  SupportedProtocols
} from "@poktscan/keyring";

// @ts-ignore
import {WebEncryptionService} from '@poktscan/keyring-encryption-web'
import {MockServerFactory} from "../../../../../mocks/mock-server-factory";

describe('PocketNetworkProtocolService', () => {
  const network : INetwork = {
    rpcUrl: "http://localhost:8080",
    protocol: SupportedProtocols.Pocket,
    chainID: "testnet",
  };

  const account =
      new AccountReference({
        id: 'account-id',
        name: 'test-account',
        address: 'test-address',
        protocol: SupportedProtocols.Pocket,
      });

  const encryptionService: IEncryptionService = new WebEncryptionService();
  const protocolService = new PocketNetworkProtocolService(encryptionService);


  const accountImport = {
    privateKey: 'f0f18c7494262c805ddb2ce6dc2cc89970c22687872e8b514d133fafc260e43d49b7b82f1aec833f854da378d6658246475d3774bd323d70b098015c2b5ae6db',
    publicKey: '49b7b82f1aec833f854da378d6658246475d3774bd323d70b098015c2b5ae6db',
    address: '30fd308b3bf2126030aba7f0e342dcb8b4922a8b',
  }

  ProtocolServiceSpecFactory<SupportedProtocols.Pocket>(
    () => protocolService,
    { network, account, accountImport }
  )

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
      const mockServer = new MockServerFactory(network);
      const server = mockServer.addSuccessfulQueryFeeHandler().buildServer();

      beforeAll(() => server.listen());

      afterEach(() => server.resetHandlers());

      afterAll(() => server.close());

      test('returns the fee of the network', async () => {
        const fee = await protocolService.getFee(network)
        expect(fee).toStrictEqual({
          protocol: SupportedProtocols.Pocket,
          value: 0.01,
        })
      })
    })

    describe('Unsuccessful requests', () => {
      const mockServer = new MockServerFactory(network);
      const server = mockServer.addFailedQueryFeeHandler().buildServer();

      beforeAll(() => server.listen());

      afterEach(() => server.resetHandlers());

      afterAll(() => server.close());

      test('throws a request error if request fails', () => {
        return expect(protocolService.getFee(network)).rejects.toThrow(NetworkRequestError)
      })
    })
  })
})
