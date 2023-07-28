import {describe} from "vitest";
import ProtocolServiceSpecFactory from '../IProtocolService.specFactory';
import {
  Asset,
  PocketNetworkProtocolService,
  IEncryptionService, PocketNetworkProtocol
} from "@poktscan/keyring";

// @ts-ignore
import {WebEncryptionService} from '@poktscan/keyring-encryption-web'

describe('PocketNetworkProtocolService', () => {
  const pokt: Asset = new Asset({
    name: 'Pokt Network - Testnet',
    protocol: new PocketNetworkProtocol('testnet'),
    symbol: 'POKT'
  })

  const encryptionService: IEncryptionService = new WebEncryptionService();

  ProtocolServiceSpecFactory<PocketNetworkProtocolService>(() => new PocketNetworkProtocolService(encryptionService), pokt)
})
