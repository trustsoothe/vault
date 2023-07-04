import {describe} from "vitest";
import ProtocolServiceSpecFactory from '../IProtocolService.specFactory';
import {
  Asset,
  Network,
  SupportedProtocols,
  PocketNetworkProtocolService,
  IEncryptionService
} from "@poktscan/keyring";

import {WebEncryptionService} from '@poktscan/keyring-encryption-web'

describe('PocketNetworkProtocolService', () => {
  const network: Network = new Network({
    name: 'Testnet',
    rpcUrl: 'https://example.com',
    protocol: SupportedProtocols.POCKET_NETWORK,
    chainId: '1'
  })

  const pokt: Asset = new Asset({
    name: 'Pokt Network - Testnet',
    network,
    symbol: 'POKT'
  })

  const encryptionService: IEncryptionService = new WebEncryptionService();

  ProtocolServiceSpecFactory<PocketNetworkProtocolService>(() => new PocketNetworkProtocolService(encryptionService), pokt)
})
