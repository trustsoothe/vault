import {describe, test, expect} from "vitest";
import {
  AccountReference,
  ArgumentError,
  IEncryptionService,
  INetwork,
  PocketNetworkShannonProtocolService,
  SupportedProtocols
} from "@poktscan/vault";
import {WebEncryptionService} from "@poktscan/vault-encryption-web";
import ProtocolServiceSpecFactory from "../IProtocolService.specFactory";

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
  });
});
