---
"@soothe/extension": patch
---

Fixed switching between chains of the same protocol (e.g. Pocket Mainnet <-> Pocket Beta, ETH Mainnet <-> Sepolia) doing nothing when the browser has frozen tabs (Chrome Memory Saver / background tab freezing). The switch notified every open tab and waited for all of them to answer; a frozen tab never answers until it is thawed, so the switch never completed (the choice was saved and only applied after reloading the extension). Tab notifications for chain changes, account changes, connection approvals and disconnections are now sent without waiting for an answer, and a failed network switch is reported with an error notification instead of failing silently.
