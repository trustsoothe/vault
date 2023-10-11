import {describe} from "vitest";
import ProtocolServiceSpecFactory from '../IProtocolService.specFactory';
import {
  AccountReference,
  Asset,
  EthereumNetworkProtocolService,
  IEncryptionService,
  Network,
  SupportedProtocols,
  IEncryptionService,
} from "@poktscan/keyring";
import {WebEncryptionService} from "@poktscan/keyring-encryption-web";

describe('EthereumNetworkProtocolService', () => {
  const asset: Asset = new Asset({
    name: 'Ethereum Sepolia',
    protocol: SupportedProtocols.Ethereum,
    symbol: 'ETH'
  })

  const network = new Network<SupportedProtocols.Ethereum>({
    name: 'test',
    rpcUrl: 'http://localhost:8080',
    protocol: asset.protocol,
    chainID: '11155111',
  })

  const account =
    new AccountReference(
      'account-id',
      'test-account',
      '0x3F56d4881EB6Ae4b6a6580E7BaF842860A0D2465',
      asset,
    );

  const accountImport = {
    privateKey: 'e65700becfed73028e0d00d81217e9bfd5db4af9cbc960493b6ffa5633e98797',
    publicKey: '0x7ff21bc4f68979598e3f9e47bb814a9a3115678b0a577050af08bcb2af0826cb16d4901b7e913f05dcdc57b874bc9f73e8ebe08737704e2c005398466a8f918f',
    address: '0x3F56d4881EB6Ae4b6a6580E7BaF842860A0D2465',
  }

  const encryptionService: IEncryptionService = new WebEncryptionService();
  const protocolService = new EthereumNetworkProtocolService(encryptionService);

  ProtocolServiceSpecFactory<SupportedProtocols.Ethereum>(
    () => protocolService,
    { asset, network, account, accountImport }
  )
})
