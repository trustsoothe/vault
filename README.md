# Soothe Vault Turborepo

## Setup

Before start running the code you must:

- Install Node.js with a version higher or equal to 16.0.0 and npm with higher or equal to 7.0.0.
- Install yarn (this turborepo uses yarn as a package manager). You can install it running the following
  command: `npm install yarn@1.22.19`.
- Install all the dependencies running `yarn install` or `yarn`.

## Apps and Packages

This monorepo includes the following packages/apps:

- `extension`: a browser web extension app for Firefox and Chromium based browsers to manage EVM and Pocket based
  wallets.
- `vault`: is a Universal Crypto Wallet Manager.
- `vault-encryption-web`: a Web Crypto API based encryption plugin for the Universal Crypto Wallet Manager.
- `vault-storage-filesystem`: a web extensions based storage plugin for the Universal Crypto Wallet Manager.
- `vault-storage-filesystem`: a filesystem based storage plugin for the Universal Crypto Wallet Manager.
- `vault-specs`: Automated Specs for the Universal Crypto Wallet Manager.
- `tsconfig`: `tsconfig.json`s used throughout the monorepo

Each package/app is 100% [TypeScript](https://www.typescriptlang.org/).

### Build

To build all apps and packages, run the following command: `yarn build`.

For more info on how to build the Browser extension for Firefox or Chromium based browsers, go
to `/apps/nodejs/extension/README.md`
