---
"@soothe/extension": patch
---

Dependency maintenance: bumped ses to 1.12.0 (via @lavamoat/webpack 0.10.0-beta.0) for GHSA-h9w6-f932-gq62, removed the unused tls-browserify and net-browserify polyfills (drops node-forge and ws@0.4), and applied the pending Dependabot bumps (axios, follow-redirects, pbkdf2, qs, brace-expansion, fast-uri, source-map-js, svgo, browserslist). CI now runs on Node 24.
