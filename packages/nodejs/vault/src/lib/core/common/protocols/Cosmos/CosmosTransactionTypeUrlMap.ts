import { CosmosTransactionTypes } from './' // Adjust the import to match the file location

export const CosmosTransactionTypeUrlMap: Record<CosmosTransactionTypes, string> = {
  [CosmosTransactionTypes.Send]: '/cosmos.bank.v1beta1.MsgSend',
  [CosmosTransactionTypes.StakeSupplier]: '/pocket.supplier.MsgStakeSupplier',
  [CosmosTransactionTypes.UnstakeSupplier]: '/pocket.supplier.MsgUnstakeSupplier',
  [CosmosTransactionTypes.ClaimSupplier]: '/pocket.migration.MsgClaimMorseSupplier',
  [CosmosTransactionTypes.ClaimAccount]: '/pocket.migration.MsgClaimMorseAccount',
  [CosmosTransactionTypes.Delegate]: '/cosmos.staking.v1beta1.MsgDelegate',
  [CosmosTransactionTypes.Undelegate]: '/cosmos.staking.v1beta1.MsgUndelegate',
  [CosmosTransactionTypes.BeginRedelegate]: '/cosmos.staking.v1beta1.MsgBeginRedelegate',
  [CosmosTransactionTypes.WithdrawDelegatorReward]: '/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward',
}
