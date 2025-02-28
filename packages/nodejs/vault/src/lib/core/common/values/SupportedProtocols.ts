export const POCKET_NETWORK_PROTOCOL = 'Pocket'
export const ETHEREUM_PROTOCOL = 'Ethereum'
export const COSMOS_PROTOCOL = 'Cosmos'

export enum SupportedProtocols {
  Pocket = 'Pocket',
  Ethereum = 'Ethereum',
  Cosmos = 'Cosmos',
}

const enumValues = [
  SupportedProtocols.Pocket,
  SupportedProtocols.Ethereum,
  SupportedProtocols.Cosmos,
] as const

if (enumValues.length !== Object.values(SupportedProtocols).length) {
  throw new Error('SupportedProtocols enum is missing values')
}

export type SupportedProtocolsArray = typeof enumValues;
