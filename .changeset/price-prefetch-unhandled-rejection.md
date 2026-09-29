---
"@soothe/extension": patch
---

A failed price request no longer raises an unhandled promise rejection in the service worker. The background price prefetch called `.catch()` without a handler, so every CoinGecko error (403/429) surfaced as `Uncaught (in promise)` in the console.
