# Extension remote assets (former DigitalOcean Space)

Faithful snapshot (2026-08-24) of every object in the `soothe-vault` DigitalOcean
Space (`https://soothe-vault.nyc3.cdn.digitaloceanspaces.com/`), which is being
decommissioned. The extension fetches these at runtime:

- `networks.json` / `assets.json` — network and asset lists (refreshed every 20
  minutes; `NETWORKS_CDN_URL` / `ASSETS_CDN_URL`)
- `pokt-chains-map.json` / `pokt-testnet-chains-map.json` — chain id -> label
  maps for stake transactions (`POKT_*_CHAIN_MAPS_URL`)
- `chains-images/` — chain icons (`CHAIN_IMAGES_CDN_URL`, also referenced by
  `iconUrl` inside networks.json/assets.json)

The other files (`*-candidates.json`, `networks-with-local.json`,
`delegators.json`, `providers.json`, `pocket-beta/`) were also in the Space and
are kept for reference; the extension does not fetch them.

Changes to these files are reviewed like code. After changing them, publish to
wherever the `*_CDN_URL` variables point (see the workflow/environment
variables in the repo settings).
