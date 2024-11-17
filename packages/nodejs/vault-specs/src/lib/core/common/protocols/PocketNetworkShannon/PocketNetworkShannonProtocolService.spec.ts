import {afterEach, describe, expect, test, beforeAll, afterAll} from "vitest";
import {
  AccountReference,
  ArgumentError,
  IEncryptionService,
  INetwork,
  PocketNetworkShannonProtocolService,
  PocketNetworkShannonProtocolTransaction,
  PocketNetworkShannonTransactionTypes,
  SupportedProtocols
} from "@poktscan/vault";
import {WebEncryptionService} from "@poktscan/vault-encryption-web";
import ProtocolServiceSpecFactory from "../IProtocolService.specFactory";
import {setupServer} from "msw/node";
import {sendTransactionHandlerFactory, queryStatusHandlerFactory} from "../../../../../mocks/pocket-network-shannon";

describe('PocketNetworkShannonProtocolService', () => {
  const network : INetwork = {
    rpcUrl: "http://localhost:8080",
    protocol: SupportedProtocols.PocketShannon,
    chainID: "poktroll",
  };

  const account =
    new AccountReference({
      id: 'account-id',
      name: 'test-account',
      address: 'test-address',
      protocol: SupportedProtocols.PocketShannon,
      publicKey: 'test-public-key',
    });

  const encryptionService: IEncryptionService = new WebEncryptionService();
  const protocolService = new PocketNetworkShannonProtocolService(encryptionService);


  const accountImport = {
    privateKey: 'bc8f9121140c68d7fbad3a512f570bcda854084626ceb0dbf4b0b709dd10b5e9',
    publicKey: '03d651cb90a7b4d3eaae745b96aaf8586091f210664e8e132c7ca0a7654f200708',
    address: 'pokt1x32rwm2skj490m4kx0yj63qzl6sdreul4u2ysj',
  }

  ProtocolServiceSpecFactory<SupportedProtocols.PocketShannon>(
    () => protocolService,
    { network, account, accountImport }
  )

  describe('sendTransaction', () => {
    describe('validations', () => {
      test('throws if Network object provided is invalid', () => {
        // @ts-ignore
        return expect(() => protocolService.sendTransaction({})).rejects.toThrow(ArgumentError);
      })

      test('throws if provided transaction object is not valid', () => {
        // @ts-ignore
        return expect(protocolService.sendTransaction(network, {})).rejects.toThrow(ArgumentError);
      });
    });

    describe('When executed', () => {
      const mockServer = setupServer(...queryStatusHandlerFactory(network));

        beforeAll(() => mockServer.listen());
        afterAll(() => mockServer.close());
        afterEach(() => mockServer.resetHandlers());

        test('returns transaction hash', async () => {
          mockServer.use(
            ...sendTransactionHandlerFactory(network)
          );

            const transaction: PocketNetworkShannonProtocolTransaction = {
              protocol: SupportedProtocols.PocketShannon,
              transactionType: PocketNetworkShannonTransactionTypes.Send,
              from: accountImport.address,
              to: account.address,
              privateKey: accountImport.privateKey,
              amount: '1000000000',
              fee: {
                protocol: SupportedProtocols.PocketShannon,
                value: 10000,
                denom: 'upokt',
              },
            };

            const result = await protocolService.sendTransaction(network, transaction);

            expect(result).toEqual(expect.objectContaining({
                transactionHash: 'E3B0C44298FC1C149AFBF4C8996FB92427AE41E4649B934CA495991B7852B855',
            }));
        });
    });
  });
});
