export enum PocketNetworkTransactionTypes {
  AppStake = 'app_stake',
  AppTransfer = 'app_transfer',
  AppUnjail = 'app_unjail',
  AppUnstake = 'app_unstake',
  GovChangeParam = 'gov_change_param',
  GovDAOTransfer = 'gov_dao_transfer',
  GovUpgrade = 'gov_upgrade',
  NodeStake = 'node_stake',
  NodeUnjail = 'node_unjail',
  NodeUnstake = 'node_unstake',
  Send = 'send',
}

export const PocketNetworkAppStake = PocketNetworkTransactionTypes.AppStake
export const PocketNetworkAppTransfer = PocketNetworkTransactionTypes.AppTransfer
export const PocketNetworkAppUnjail = PocketNetworkTransactionTypes.AppUnjail
export const PocketNetworkAppUnstake = PocketNetworkTransactionTypes.AppUnstake
export const PocketNetworkGovChangeParam = PocketNetworkTransactionTypes.GovChangeParam
export const PocketNetworkGovDAOTransfer = PocketNetworkTransactionTypes.GovDAOTransfer
export const PocketNetworkGovUpgrade = PocketNetworkTransactionTypes.GovUpgrade
export const PocketNetworkNodeStake = PocketNetworkTransactionTypes.NodeStake
export const PocketNetworkNodeUnjail = PocketNetworkTransactionTypes.NodeUnjail
export const PocketNetworkNodeUnstake = PocketNetworkTransactionTypes.NodeUnstake
export const PocketNetworkSend = PocketNetworkTransactionTypes.Send

const enumValues = [
  PocketNetworkTransactionTypes.AppStake,
  PocketNetworkTransactionTypes.AppTransfer,
  PocketNetworkTransactionTypes.AppUnjail,
  PocketNetworkTransactionTypes.AppUnstake,
  PocketNetworkTransactionTypes.GovChangeParam,
  PocketNetworkTransactionTypes.GovDAOTransfer,
  PocketNetworkTransactionTypes.GovUpgrade,
  PocketNetworkTransactionTypes.NodeStake,
  PocketNetworkTransactionTypes.NodeUnjail,
  PocketNetworkTransactionTypes.NodeUnstake,
  PocketNetworkTransactionTypes.Send,
] as const

if (enumValues.length !== Object.values(PocketNetworkTransactionTypes).length) {
  throw new Error('PocketNetworkTransactionTypes enum is missing values')
}

export type PocketNetworkTransactionTypesArray = typeof enumValues;
