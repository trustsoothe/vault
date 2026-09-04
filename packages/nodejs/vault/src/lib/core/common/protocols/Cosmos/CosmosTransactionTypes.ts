export enum CosmosTransactionTypes {
  Send = 'send',
  StakeSupplier = 'stake_supplier',
  UnstakeSupplier = 'unstake_supplier',
  ClaimSupplier = 'claim_supplier',
  ClaimAccount = 'claim_account',
  Delegate = 'delegate',
  Undelegate = 'undelegate',
  BeginRedelegate = 'begin_redelegate',
  WithdrawDelegatorReward = 'withdraw_delegator_reward',
}
