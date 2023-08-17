import {describe, expect, test} from "vitest";
import ProtocolServiceSpecFactory from '../IProtocolService.specFactory';
import {
  Asset,
  PocketNetworkProtocolService,
  IEncryptionService, PocketNetworkProtocol, ArgumentError, Passphrase
} from "@poktscan/keyring";

// @ts-ignore
import {WebEncryptionService} from '@poktscan/keyring-encryption-web'

describe('PocketNetworkProtocolService', () => {
  const asset: Asset = new Asset({
    name: 'Pokt Network - Testnet',
    protocol: new PocketNetworkProtocol('testnet'),
    symbol: 'POKT'
  })

  const encryptionService: IEncryptionService = new WebEncryptionService();
  const protocolService = new PocketNetworkProtocolService(encryptionService);
  const passphrase = new Passphrase('passphrase')

  ProtocolServiceSpecFactory<PocketNetworkProtocolService>(() => protocolService, asset)

  describe('Account Creation and Import - Pocket Network', () => {
    const examplePrivateKey = 'f0f18c7494262c805ddb2ce6dc2cc89970c22687872e8b514d133fafc260e43d49b7b82f1aec833f854da378d6658246475d3774bd323d70b098015c2b5ae6db'
    const expectedPublicKey = '49b7b82f1aec833f854da378d6658246475d3774bd323d70b098015c2b5ae6db';
    const expectedAddress = '30fd308b3bf2126030aba7f0e342dcb8b4922a8b';

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
})
