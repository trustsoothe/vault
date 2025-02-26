# Soothe Vault

## What is Soothe Vault?

Is a secure, user-friendly multi-blockchain wallet for managing digital assets with encryption, easy sync & web3
connectivity. Whether you are a seasoned blockchain user or new to the technology, Soothe Vault helps you seamlessly
connect to multiple blockchains, including Pocket Network (POKT), Ethereum and Cosmos.

With Soothe Vault, your keys and assets remain in your control:

- Securely manage your digital assets with high-grade encryption.
- Synchronize and navigate multiple blockchain wallets effortlessly.
- Browse and connect to decentralized websites.
- Control the information you share and maintain your privacy.

To add an extra layer of security to the extension, we implemented [LavaMoat](https://github.com/LavaMoat/LavaMoat) to
Soothe Vault. LavaMoat, per their GitHub repository, is:
> A set of tools for securing JavaScript projects against a category of attacks called software supply chain attacks.
>
> This genre of attack occurs when a malicious dependency makes its way into a developer's application.

For more info about the Extension, go
to its own [README.md](/apps/nodejs/extension/README.md).

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
  based wallets.
- `vault`: is a Universal Crypto Wallet Manager.
- `vault-encryption-web`: a Web Crypto API based encryption plugin for the Universal Crypto Wallet Manager.
- `vault-storage-extension`: a web extensions based storage plugin for the Universal Crypto Wallet Manager.
- `vault-storage-filesystem`: a filesystem based storage plugin for the Universal Crypto Wallet Manager.
- `vault-specs`: Automated Specs for the Universal Crypto Wallet Manager.
- `tsconfig`: `tsconfig.json`s used throughout the monorepo

### Build

To build all apps and packages, run the following command: `yarn build`.
