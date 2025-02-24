# Soothe Vault

## What is Soothe Vault?

A secure, user-friendly multi-blockchain wallet for managing digital assets with encryption, easy sync & web3
connectivity. Whether you are a seasoned blockchain user or new to the technology, Soothe Vault helps you seamlessly
connect to multiple blockchains, including Pocket Network (POKT), Ethereum and Cosmos.

With Soothe Vault, your keys and assets remain in your control:

- Securely manage your digital assets with high-grade encryption.
- Synchronize and navigate multiple blockchain wallets effortlessly.
- Browse and connect to decentralized websites.
- Control the information you share and maintain your privacy.

You can download Soothe Vault for the following browsers:

- [Chrome and Brave](https://chromewebstore.google.com/detail/soothe-vault/mcgbfmioikpilhncbhdkjbjinfhgplpa)
- Firefox (coming soon)

For more info about Soothe:

- Website: https://trustsoothe.io
- Privacy Policy: https://trustsoothe.io/privacy-policy
- Terms of Use: https://trustsoothe.io/terms-of-use

## Setup

Before start running the code you must:

- Install Node.js with a version higher or equal to 16.0.0 and npm with higher or equal to 7.0.0.
- Install yarn (this turborepo uses yarn as a package manager). You can install it running the following
  command: `npm install yarn@1.22.19`.
- Install all the dependencies running `yarn install` or `yarn`.

## Apps and Packages

This monorepo includes the following packages/apps:

- `extension`: a browser web extension app for Firefox and Chromium based browsers to manage EVM, Pocket and Cosmos
  based
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

For more info about the Browser extension for Firefox or Chromium based browsers, go
to `/apps/nodejs/extension/README.md`
