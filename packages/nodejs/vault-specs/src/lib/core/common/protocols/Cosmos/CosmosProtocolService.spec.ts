import {afterEach, describe, expect, test, beforeAll, afterAll} from "vitest";
import {
  AccountReference,
  ArgumentError,
  IEncryptionService,
  INetwork,
  CosmosProtocolService,
  CosmosProtocolTransaction,
  CosmosTransactionTypes, SignPersonalDataRequest,
  SupportedProtocols
} from "@poktscan/vault";
import {WebEncryptionService} from "@poktscan/vault-encryption-web";
import ProtocolServiceSpecFactory from "../IProtocolService.specFactory";
import {setupServer} from "msw/node";
import {
  sendTransactionHandlerFactory,
  queryStatusHandlerFactory,
  queryAccountHandlerFactory,
  queryTransactionHandlerFactory
} from "../../../../../mocks/cosmos";

describe('CosmosProtocolService', () => {
  const network : INetwork = {
    rpcUrl: "http://localhost:8080",
    protocol: SupportedProtocols.Cosmos,
    chainID: "poktroll",
  };

  const account =
    new AccountReference({
      id: '18e47989-2ef0-497a-9107-bac2bc08d993',
      name: 'test-account',
      address: 'pokt1gw5kpvs5stt899ulw3x3dp6vsjjx2t0wue8quk',
      protocol: SupportedProtocols.Cosmos,
      publicKey: '033878462bdb45290e6c0df06b7719976f257dda75d33a785d3139a98658f82300',
      prefix: 'pokt',
    });

  const encryptionService: IEncryptionService = new WebEncryptionService();
  const protocolService = new CosmosProtocolService(encryptionService);


  const accountImport = {
    privateKey: 'bc8f9121140c68d7fbad3a512f570bcda854084626ceb0dbf4b0b709dd10b5e9',
    publicKey: '03d651cb90a7b4d3eaae745b96aaf8586091f210664e8e132c7ca0a7654f200708',
    address: 'pokt1x32rwm2skj490m4kx0yj63qzl6sdreul4u2ysj',
  }

  ProtocolServiceSpecFactory<SupportedProtocols.Cosmos>(
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
      const mockServer = setupServer(
        ...queryAccountHandlerFactory(network),
        ...queryStatusHandlerFactory(network),
        ...queryTransactionHandlerFactory(network),
      );

        beforeAll(() => mockServer.listen());
        afterAll(() => mockServer.close());
        afterEach(() => mockServer.resetHandlers());

        test('returns transaction hash', async () => {
          mockServer.use(
            ...sendTransactionHandlerFactory(network),
          );

            const transaction: CosmosProtocolTransaction = {
              protocol: SupportedProtocols.Cosmos,
              transactionType: CosmosTransactionTypes.Send,
              from: accountImport.address,
              to: account.address,
              privateKey: accountImport.privateKey,
              amount: '100',
              fee: {
                protocol: SupportedProtocols.Cosmos,
                value: 0,
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

  describe('signPersonalData', () => {
    const pk =  accountImport.privateKey;

    const testCaseExpectations: [string, string, string][] = [
      ['hello world', '75959ecb1cde2eb8f89bee57da0fb8d2b70b80f525e708a07fe0ddc4dce6dcaa724d2bd29d240578c977cd1d2d5fc61c9e774f6fde210a9e2dad1510bac2540801', pk],
      ['pocket network signature test', 'ba761ae35b44cba55d9c6cdf8a1abc564249412abff7f15a11e7e0049252223306b6f1943858a25ff29a0a5b7a5f544b598e17b12c86d8ea058cb4d56aa6520400', pk],
      ['testing the sign message of pokt', '242183ad36a16c869c716446fcd94ee5b3e9398e734fdbb91f87e9494a60ba5c194ecd404c6730f45b6eb0bdb4d0cb14365c723705919fe23c5d3c43d2d5b35200', pk],
      [`pokt.money wants you to sign in with your Pocket account:
0xe48940220017c66dBce937CEEf7B18F941a167d7

Sign-In With Pocket Statement

URI: https://pokt.money/
Version: 1
Chain ID:  mainnet
Nonce: p0b3n182
Issued At: 2024-08-12T16:25:38.799Z
Expiration Time: 2024-08-14T16:25:38.796Z`,
        '99b901a635795d6d699686b7dfc111c0c17009a33aeee45afe403c3118eda8150bb62b31c7a5ff0de15a4da24fc95cb388201f244ed24432528b36d0ae9e84f300', pk],
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
});
