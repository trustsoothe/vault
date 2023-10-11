import {describe, expect, test} from "vitest";
import ProtocolServiceSpecFactory from '../IProtocolService.specFactory';
import {
  Asset,
  PocketNetworkProtocolService,
  IEncryptionService, PocketNetworkProtocol, ArgumentError, Passphrase, Network, AccountReference
} from "@poktscan/keyring";

// @ts-ignore
import {WebEncryptionService} from '@poktscan/keyring-encryption-web'

describe('PocketNetworkProtocolService', () => {
  const asset: Asset = new Asset({
    name: 'Pokt Network - Testnet',
    protocol: new PocketNetworkProtocol('testnet'),
    symbol: 'POKT'
  })

  const network = new Network({
    name: 'test',
    rpcUrl: 'http://localhost:8080',
    protocol: asset.protocol,
  })

  const account =
    new AccountReference(
      'account-id',
      'test-account',
      'test-address',
      asset.protocol,
    );

  const encryptionService: IEncryptionService = new WebEncryptionService();
  const protocolService = new PocketNetworkProtocolService(encryptionService);


  const accountImport = {
    privateKey: 'f0f18c7494262c805ddb2ce6dc2cc89970c22687872e8b514d133fafc260e43d49b7b82f1aec833f854da378d6658246475d3774bd323d70b098015c2b5ae6db',
    publicKey: '49b7b82f1aec833f854da378d6658246475d3774bd323d70b098015c2b5ae6db',
    address: '30fd308b3bf2126030aba7f0e342dcb8b4922a8b',
  }

  ProtocolServiceSpecFactory<PocketNetworkProtocolService>(
    () => protocolService,
    { asset, network, account, accountImport }
  )
})
