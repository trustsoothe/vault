---
"@soothe/extension": minor
"@soothe/vault": patch
---

Improve seed phrase handling and validation in RemoveSeedModal and FillSeedPhrase

    - Added `useEffect` in RemoveSeedModal to update `phraseSize` based on phrase length.
    - Enhanced FillSeedPhrase with whitespace trimming and word filtering for better accuracy.
    - Refined logic to handle empty or invalid seed words.

Add `useCapsLock` hook and integrate CapsLock warning in PasswordInput

    - Introduced `useCapsLock` hook to detect CapsLock state.
    - Added a warning message in `PasswordInput` when CapsLock is enabled.
    - Updated `TransactionDetailModal` label to reflect success status.

Refactor protocol and transaction handling

    - Updated `watch` usage in `ImportAccountModal` to include `protocol` simplifying dependency tracking.
    - Replaced redundant calls to `watch("protocol")` with the `protocol` variable for cleaner logic.
    - Removed debug `console.log` statement from `PoktTransactionRequest`.
    - Fixed lodash `debounce` import path in `BaseTransaction`.
    - Restored `maxFeePerGas` to the transaction schema for extended support of users that might have this stored on their data.

Add gas-related properties (`estimatedGas`, `gasAdjustment`, `gasPrice`) to transaction handling

    Expanded transaction schema and logic to include gas-related properties. Updated Cosmos and Redux implementations for improved gas calculation and flexibility.

Add support for `gasPrice`, `gas`, and `gasAdjustment` in transaction parameters

    Expanded transaction parameter handling by introducing `gasPrice`, `gas`, and `gasAdjustment` properties. Updated existing logic to replace `maxFeePerGas` with `gasPrice` for consistency across transactions.

