---
"@soothe/vault": minor
"@soothe/extension": minor
---

Dapps can now request signatures for Cosmos staking and distribution messages on Pocket Shannon: `/cosmos.staking.v1beta1.MsgDelegate`, `/cosmos.staking.v1beta1.MsgUndelegate`, `/cosmos.staking.v1beta1.MsgBeginRedelegate` and `/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward`. Previously any of these was rejected with an invalid `typeUrl` error before the signing dialog opened. The delegator is the requesting account; a `delegatorAddress` in the message body that does not match it is rejected as invalid instead of silently overridden. Amounts are passed as integer upokt strings, as with `MsgSend`.
