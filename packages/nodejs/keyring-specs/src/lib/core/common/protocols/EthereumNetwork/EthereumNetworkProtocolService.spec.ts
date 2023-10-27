import {afterAll, afterEach, beforeAll, describe, expect, test} from "vitest";
import ProtocolServiceSpecFactory from "../IProtocolService.specFactory";
import {
  AccountReference,
  Asset,
  EthereumNetworkProtocolService,
  Network,
  SupportedProtocols,
  IEncryptionService, ArgumentError, NetworkRequestError, EthereumNetworkFeeRequestOptions, IAsset, INetwork,
} from "@poktscan/keyring";
import { WebEncryptionService } from "@poktscan/keyring-encryption-web";
import {MockServerFactory} from "../../../../../mocks/mock-server-factory";

describe("EthereumNetworkProtocolService", () => {
  const asset: IAsset = {
    protocol: SupportedProtocols.Ethereum,
    chainID: "11155111",
    contractAddress: "0x3F56d4881EB6Ae4b6a6580E7BaF842860A0D2465",
    decimals: 8,
  };

  const network : INetwork = {
    rpcUrl: "http://localhost:8080",
    protocol: asset.protocol,
    chainID: "11155111",
  };

  const account = new AccountReference(
    "account-id",
    "test-account",
    "0x3F56d4881EB6Ae4b6a6580E7BaF842860A0D2465",
    SupportedProtocols.Ethereum,
  );

  const accountImport = {
    privateKey:
      "e65700becfed73028e0d00d81217e9bfd5db4af9cbc960493b6ffa5633e98797",
    publicKey:
      "0x7ff21bc4f68979598e3f9e47bb814a9a3115678b0a577050af08bcb2af0826cb16d4901b7e913f05dcdc57b874bc9f73e8ebe08737704e2c005398466a8f918f",
    address: "0x3F56d4881EB6Ae4b6a6580E7BaF842860A0D2465",
  };

  const encryptionService: IEncryptionService = new WebEncryptionService();
  const protocolService = new EthereumNetworkProtocolService(encryptionService);

  ProtocolServiceSpecFactory<SupportedProtocols.Ethereum>(
    () => protocolService,
    { asset, network, account, accountImport }
  );

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

      test('throws if undefined is provided as the options', () => {
        // @ts-ignore
        return expect(protocolService.getFee(network, undefined)).rejects.toThrow(ArgumentError);
      })

      test('throws if an invalid fee request option is passed', () => {
        // @ts-ignore
        return expect(protocolService.getFee(network, {})).rejects.toThrow(ArgumentError);
      })
    })

    describe('Successful requests', () => {
      const mockServer = new MockServerFactory(network);
      const server = mockServer.addSuccessfulQueryFeeHandler().buildServer();

      beforeAll(() => server.listen());

      afterEach(() => server.resetHandlers());

      afterAll(() => server.close());

      test('returns the fee of the network', async () => {
        const feeRequestOptions: EthereumNetworkFeeRequestOptions = {
          protocol: SupportedProtocols.Ethereum,
          to: '0x3F56d4881EB6Ae4b6a6580E7BaF842860A0D2465',
        };

        const fee = await protocolService.getFee(network, feeRequestOptions);

        const expectedFee = {
          protocol: SupportedProtocols.Ethereum,
          estimatedGas: 31500,
          baseFee: '0.000000444',
          low: {
            suggestedMaxPriorityFeePerGas: 1000000000,
            suggestedMaxFeePerGas: 1000000444,
            amount: '0.0000315',
          },
          medium: {
            suggestedMaxPriorityFeePerGas: 1500000000,
            suggestedMaxFeePerGas: 1500000600,
            amount: '0.0000473',
          },
          high: {
            suggestedMaxPriorityFeePerGas: 2000000000,
            suggestedMaxFeePerGas: 2000000755,
            amount: '0.0000630',
          },
        };

        expect(expectedFee).toStrictEqual(fee);
      })
    })

    describe('Unsuccessful requests', () => {
      const mockServer = new MockServerFactory(network);
      const server = mockServer.addFailedQueryFeeHandler().buildServer();

      beforeAll(() => server.listen());

      afterEach(() => server.resetHandlers());

      afterAll(() => server.close());

      test('throws a request error if request fails', () => {
        const feeRequestOptions: EthereumNetworkFeeRequestOptions = {
          protocol: SupportedProtocols.Ethereum,
          to: '0x3F56d4881EB6Ae4b6a6580E7BaF842860A0D2465',
        };

        return expect(protocolService.getFee(network, feeRequestOptions)).rejects.toThrow(NetworkRequestError)
      })
    })
  })

  describe('getBalance - ERC20', () => {
    const mockServer = new MockServerFactory(network);
    const server = mockServer.addSuccessfulQueryBalanceHandler().buildServer();

    beforeAll(() => server.listen());

    afterEach(() => server.resetHandlers());

    afterAll(() => server.close());

    test('returns the balance of the account', async () => {
      const balance = await protocolService.getBalance(account, network, asset)
      expect(balance).toBe(408.71715)
    })
  })
});
