import {afterAll, afterEach, beforeAll, describe, expect, test} from "vitest";
import ProtocolServiceSpecFactory from '../IProtocolService.specFactory';
import {
  AccountReference,
  ArgumentError,
  IEncryptionService,
  INetwork,
  NetworkRequestError,
  PocketNetworkProtocolService,
  SignPersonalDataRequest,
  PocketNetworkTransactionTypes,
  SupportedProtocols,
  PocketNetworkTransactionValidationResults,
  PocketNetworkProtocolTransaction, TransactionValidationResultType,
} from "@poktscan/vault";

// @ts-ignore
import {WebEncryptionService} from '@poktscan/vault-encryption-web'
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
        publicKey: 'test-public-key',
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

  describe('signPersonalData', () => {
    const pk = 'c24a7a6f99347bd3ccc0183d3e65f7707f207e0292722625777860b5229c4ea561e495540c744b084a24d32c8b4d7337e670b80d745a640d4c759654b48e10bf';

    const testCaseExpectations: [string, string, string][] = [
      ['hello world', '4f59b1a623035c1a01056e0f3443b257380d742bc3fe8156b45a643bfd9a740dc649674403c40bd166182083a41580b4154f7d90018e600796b8146e08c7500a', pk],
      ['pocket network signature test', 'ba513b690dca27e56a72f96f4232ef5e16041cb625354abc1e87b7a663f302b89e8d41e425da0305ae2c8851284e986a427288921fc392856511793c0fe6c00c', pk],
      ['testing the sign message of pokt', '8fba4de747a31de7981cf9d258bf510ff511e8aea1571979222d4187d8fcfe9392be2b1cb825471a5b4285119352795882ef5be35a25fe506cf7e7ebcaf34408', pk],
      [`pokt.money wants you to sign in with your Pocket account:
0xe48940220017c66dBce937CEEf7B18F941a167d7

Sign-In With Pocket Statement

URI: https://pokt.money/
Version: 1
Chain ID:  mainnet
Nonce: p0b3n182
Issued At: 2024-08-12T16:25:38.799Z
Expiration Time: 2024-08-14T16:25:38.796Z`,
      '913a5c780be8748914d7dd70f23b47cb49a8814dddc4b17f35d676480c6cb02370e817ad0a1ff8d677594952e4a8b38a435e74a7a11551da6b2a4a6681089f0d', pk],
    ]

    test.each(testCaseExpectations)('For: %s it resolves to: %s', async (challenge, expectedSignature, privateKey) => {
      const input: SignPersonalDataRequest = {
        challenge,
        privateKey,
      }

      const signature = await protocolService.signPersonalData(input);

      expect(expectedSignature).toEqual(signature);
    })
  })

  describe('validateTransaction', () => {
    describe(`${PocketNetworkTransactionTypes.NodeStake}`, () => {
      const mockServer = new MockServerFactory(network);
      const server = mockServer.addSuccessfulQueryNodeHandler().buildServer();

      beforeAll(() => server.listen());

      afterEach(() => server.resetHandlers());

      afterAll(() => server.close());

      test('throws if undefined is provided', () => {
        // @ts-ignore
        return expect(protocolService.validateTransaction(undefined, network)).rejects.toThrow(ArgumentError);
      })

      test('throws if null is provided', () => {
        // @ts-ignore
        return expect(protocolService.validateTransaction(null, network)).rejects.toThrow(ArgumentError);
      })

      test('throws if network is not provided', () => {
        // @ts-ignore
        return expect(protocolService.validateTransaction({} as any, null)).rejects.toThrow(ArgumentError);
      })

      test(`returns "${PocketNetworkTransactionValidationResults.InvalidSigner}"`, async () => {
        const transaction: PocketNetworkProtocolTransaction = {
          protocol: SupportedProtocols.Pocket,
          transactionType: PocketNetworkTransactionTypes.NodeStake,
            from: 'a931db71f2d88e479b259dad6ea02dae9f83b70c',
          to: '',
          nodePublicKey: 'af6c2cacd7070eda73ed7b142f88b5d9581b08210aaf609abe336ba36489c5b9',
          amount: '100',
          privateKey: accountImport.privateKey,
        }

        const validationResult =  await protocolService.validateTransaction(transaction, network);

        expect(validationResult.results).toContainEqual({
          type: TransactionValidationResultType.Error,
          message: PocketNetworkTransactionValidationResults.InvalidSigner,
          key: 'privateKey',
        });
      });

      test(`returns "${PocketNetworkTransactionValidationResults.OutputAddressChanged}"`, async () => {
        const transaction: PocketNetworkProtocolTransaction = {
          protocol: SupportedProtocols.Pocket,
          transactionType: PocketNetworkTransactionTypes.NodeStake,
          from: accountImport.address,
          to: '',
          nodePublicKey: accountImport.publicKey,
          amount: '100',
          privateKey: accountImport.privateKey,
          outputAddress: 'output-address',
        }

        const validationResult =  await protocolService.validateTransaction(transaction, network);

        expect(validationResult.results).toContainEqual({
          type: TransactionValidationResultType.Info,
          message: PocketNetworkTransactionValidationResults.OutputAddressChanged,
          key: 'outputAddress',
        });
      });
    });
  });
})
