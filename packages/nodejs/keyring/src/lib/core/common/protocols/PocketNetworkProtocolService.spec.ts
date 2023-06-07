import {describe, test, expect, beforeAll} from "vitest";
import protocolServiceSpecFactory from './IProtocolService.specFactory';
import {PocketNetworkProtocolService} from "./PocketNetworkProtocolService";
import {Asset} from "../../asset";
import {Network} from "../../network";
import {SupportedProtocols} from "../values";

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

  protocolServiceSpecFactory<PocketNetworkProtocolService>(PocketNetworkProtocolService, pokt)
})
