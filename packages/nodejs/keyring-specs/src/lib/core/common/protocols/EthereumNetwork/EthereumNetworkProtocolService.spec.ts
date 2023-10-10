import {describe} from "vitest";
import ProtocolServiceSpecFactory from '../IProtocolService.specFactory';
import {
  Asset,
  EthereumNetworkProtocolService,
  EthereumNetworkProtocol, Network, AccountReference,
} from "@poktscan/keyring";

describe('EthereumNetworkProtocolService', () => {
  const asset: Asset = new Asset({
    name: 'Ethereum Sepolia',
    protocol: new EthereumNetworkProtocol('11155111'),
    symbol: 'ETH'
  })

  const network: Network = new Network({
    name: 'test',
    rpcUrl: 'http://localhost:8080',
    protocol: asset.protocol,
  })

  const account =
    new AccountReference(
      'account-id',
      'test-account',
      '0x3F56d4881EB6Ae4b6a6580E7BaF842860A0D2465',
      asset.protocol,
    );

  const protocolService = new EthereumNetworkProtocolService();

  ProtocolServiceSpecFactory<EthereumNetworkProtocolService>(
    () => protocolService,
    { asset, network, account }
  )
})
