import {
  AddHDWalletAccountOptions,
  CreateAccountFromPrivateKeyOptions,
  CreateAccountOptions,
  DeriveAddressOptions,
  ImportRecoveryPhraseOptions,
  IProtocolService,
  SignPersonalDataRequest,
  SignTransactionResult,
  ValidateTransactionResult,
} from '../IProtocolService'
import { AccountReference, SupportedProtocols } from '../../values'
import { INetwork } from '../INetwork'
import { IAsset } from '../IAsset'
import { NetworkStatus } from '../../values/NetworkStatus'
import { IProtocolTransactionResult, ProtocolTransaction } from '../ProtocolTransaction'
import { Account, AccountType } from '../../../vault'
import { IEncryptionService } from '../../encryption/IEncryptionService'
import { CosmosProtocolTransaction } from './CosmosProtocolTransaction'
import { fromHex, toHex, toUtf8 } from '@cosmjs/encoding'
import { ArgumentError, InvalidPrivateKeyError, NetworkRequestError, RecoveryPhraseError } from '../../../../errors'
import { decodePubkey, DirectSecp256k1HdWallet, DirectSecp256k1Wallet, Registry } from '@cosmjs/proto-signing'
import { Bip39, EnglishMnemonic, Random, Secp256k1, sha256, Slip10, Slip10Curve } from '@cosmjs/crypto'
import { CosmosFee } from './CosmosFee'
import {
  CosmosProtocolTransactionSchema,
  MsgClaimAccountSchema,
  MsgClaimSupplierSchema,
  MsgSendSchema,
  MsgStakeSupplierSchema,
  MsgUnstakeSupplierSchema,
  PocketShannonProtocolNetworkSchema,
  PocketShannonRpcCanSendTransactionResponseSchema,
} from './schemas'
import {
  calculateFee,
  SigningStargateClient,
  TimeoutError,
  setupBankExtension,
  QueryClient,
  setupAuthExtension,
  setupTxExtension,
} from '@cosmjs/stargate'
import {encodeSecp256k1Pubkey, makeCosmoshubPath, Pubkey} from '@cosmjs/amino'
import { validateMnemonic } from '@scure/bip39'
import { wordlist } from '@scure/bip39/wordlists/english'
import { AuthInfo, TxBody, TxRaw } from './pocket/client/cosmos/tx/v1beta1/tx'
import { CosmosTransactionTypes } from './CosmosTransactionTypes'
import { MsgSend } from './pocket/client/cosmos/bank/v1beta1/tx'
import { CosmosTransactionTypeUrlMap } from './CosmosTransactionTypeUrlMap'
import { MsgStakeSupplier, MsgUnstakeSupplier } from './pocket/client/pocket/supplier/tx'
import { CosmosFeeRequestOption } from './CosmosFeeRequestOption'
import { Buffer } from 'buffer'
import { GeneratedType } from '@cosmjs/proto-signing/build/registry'
import { MsgClaimMorseAccount, MsgClaimMorseSupplier } from './pocket/client/pocket/migration/tx'
import {Comet38Client, GenesisResponse} from "@cosmjs/tendermint-rpc";
import {BaseAccount} from "./pocket/client/cosmos/auth/v1beta1/auth";
import {PubKey} from "./pocket/client/cosmos/crypto/secp256k1/keys";

export class CosmosProtocolService
  implements IProtocolService<SupportedProtocols.Cosmos> {
  constructor(private encryptionService: IEncryptionService) {}

  async createAccount(options: CreateAccountOptions): Promise<Account> {
    const privateKey = Random.getBytes(32)

    return this.createAccountFromPrivateKey({
      ...options,
      privateKey: toHex(privateKey),
    })
  }

  async createAccountFromPrivateKey(options: CreateAccountFromPrivateKeyOptions): Promise<Account> {
    if (!options.protocol) {
      throw new ArgumentError('options.protocol')
    }

    if (!options.passphrase && !options.skipEncryption) {
      throw new ArgumentError('options.passphrase')
    }

    if (!options.privateKey) {
      throw new ArgumentError('options.privateKey')
    }

    if (!this.isValidPrivateKey(options.privateKey)) {
      throw new InvalidPrivateKeyError(options.privateKey)
    }

    if (!options.addressPrefix) {
      throw new ArgumentError('options.addressPrefix')
    }

    let finalPrivateKey = options.privateKey

    if (options.passphrase) {
      finalPrivateKey = await this.encryptionService.encrypt(
        options.passphrase,
        options.privateKey,
      )
    }

    const wallet = await DirectSecp256k1Wallet.fromKey(fromHex(options.privateKey), options.addressPrefix)
    const [account] = await wallet.getAccounts()

    return new Account({
      name: options.name,
      protocol: options.protocol,
      address: account.address,
      publicKey: toHex(account.pubkey),
      privateKey: finalPrivateKey,
      secure: !options.skipEncryption,
      addressPrefix: options.addressPrefix,
    })
  }

  async createAccountsFromRecoveryPhrase(options: ImportRecoveryPhraseOptions): Promise<Account[]> {
    const isValidMnemonic = validateMnemonic(options.recoveryPhrase, wordlist)

    if (!isValidMnemonic) {
      throw new RecoveryPhraseError('Invalid recovery phrase')
    }

    const seed = await Bip39.mnemonicToSeed(new EnglishMnemonic(options.recoveryPhrase))

    const seedAccount = new Account({
      name: options.seedAccountName || 'HD Account',
      seedId: options.recoveryPhraseId,
      accountType: AccountType.HDSeed,
      protocol: SupportedProtocols.Cosmos,
      publicKey: 'N/A',
      privateKey: toHex(seed),
      address: 'N/A',
      secure: false,
      addressPrefix: options.addressPrefix,
    })

    const hdPath = makeCosmoshubPath(0)
    const wallet: DirectSecp256k1HdWallet = await DirectSecp256k1HdWallet.fromMnemonic(options.recoveryPhrase, {
      prefix: options.addressPrefix,
      hdPaths: [hdPath],
    })
    const [account] = await wallet.getAccounts()
    const { privkey } = Slip10.derivePath(Slip10Curve.Secp256k1, seed, hdPath)

    const childAccount = new Account({
      publicKey: toHex(account.pubkey),
      address: account.address,
      name: `${seedAccount.name} 1`,
      accountType: AccountType.HDChild,
      protocol: SupportedProtocols.Cosmos,
      privateKey: toHex(privkey),
      parentId: seedAccount.id,
      hdwIndex: 0,
      hdwAccountIndex: 0, // TODO: Parameterize this if we will allow users to use more than one account from the same seeds
      secure: false, // TODO: Parameterize this if we will allow users to set a password per account
      addressPrefix: options.addressPrefix,
    })

    return [
      seedAccount,
      childAccount,
    ]
  }

  async createHDWalletAccount(options: AddHDWalletAccountOptions): Promise<Account> {
    const { seedAccount, index, name } = options
    const hdPath = makeCosmoshubPath(index)
    const { privkey } = Slip10.derivePath(Slip10Curve.Secp256k1, fromHex(seedAccount.privateKey), hdPath)
    const wallet = await DirectSecp256k1Wallet.fromKey(privkey, options.addressPrefix)
    const [account] = await wallet.getAccounts()
    return new Account({
      publicKey: toHex(account.pubkey),
      address: account.address,
      name: name ? name : `${seedAccount.name} ${index + 1}`,
      accountType: AccountType.HDChild,
      protocol: SupportedProtocols.Cosmos,
      privateKey: toHex(privkey),
      parentId: seedAccount.id,
      hdwIndex: index,
      hdwAccountIndex: 0, // TODO: Parameterize this if we will allow users to use more than one account from the same seeds
      secure: false, // TODO: Parameterize this if we will allow users to set a password per account
      addressPrefix: options.addressPrefix,
    })
  }

  async getAddressFromPrivateKey(options: DeriveAddressOptions): Promise<string> {
    if (!this.isValidPrivateKey(options.privateKey)) {
      throw new InvalidPrivateKeyError(options.privateKey)
    }

    if (!options.addressPrefix) {
      throw new ArgumentError('options.addressPrefix')
    }

    const wallet = await DirectSecp256k1Wallet.fromKey(fromHex(options.privateKey), options.addressPrefix)
    const [account] = await wallet.getAccounts()
    return account.address
  }

  async getBalance(
    account: AccountReference,
    network: INetwork,
    asset?: IAsset
  ): Promise<number> {
    this.validateNetwork(network);

    try {
      const rpcEndpoint = network.rpcUrl.replace(/\/+$/, "");
      const tmClient = await Comet38Client.connect(rpcEndpoint);

      const queryClient = QueryClient.withExtensions(
        tmClient,
        setupBankExtension,
      );

      const balResponse = await queryClient.bank.allBalances(
        account.address
      );

      const upokt = balResponse.find(
        (b: { denom: string }) => b.denom === "upokt"
      );

      tmClient.disconnect();

      return upokt ? parseInt(upokt.amount, 10) : 0;
    } catch (err) {
      console.error(err);
      throw new NetworkRequestError("Failed to fetch balance");
    }
  }

  async getFee(network: INetwork, options: CosmosFeeRequestOption): Promise<CosmosFee> {
    const { transaction } = options;

    if (!network) {
      throw new ArgumentError("network");
    }
    if (!transaction) {
      throw new ArgumentError("transaction");
    }

    let estimatedGas = 80000;
    let gasAdjustmentUsed = transaction.gasAdjustment ?? 1.5;
    let gasPriceUsed = Number(transaction.gasPrice ?? 0.001);
    let value = 0;

    try {
      const rpcEndpoint = network.rpcUrl.replace(/\/+$/, "");
      const tmClient = await Comet38Client.connect(rpcEndpoint);

      const queryClient = QueryClient.withExtensions(
        tmClient,
        setupAuthExtension,
        setupTxExtension
      );

      const messages = this.buildMessages(transaction);

      let signerAddress = this.extractSignerAddressFromMessages(messages);

      if (!signerAddress) {
        throw new Error('Could not determine signer address from transaction');
      }

      const accountAny = await queryClient.auth.account(signerAddress);

      if (!accountAny || accountAny.typeUrl !== "/cosmos.auth.v1beta1.BaseAccount") {
        throw new Error(`Cannot fetch BaseAccount for ${signerAddress}`);
      }

      const baseAccount = BaseAccount.decode(accountAny.value);

      const sequence = Number(baseAccount.sequence);

      if (!baseAccount?.pubKey) {
        throw new Error(`Cannot fetch public key for ${signerAddress}`);
      }

      const rawProtobufPubKeyBytes = baseAccount?.pubKey.value;
      const decodedPubKey = PubKey.decode(rawProtobufPubKeyBytes);
      const aminoPubkey: Pubkey = encodeSecp256k1Pubkey(decodedPubKey.key);
      const registryEntries: Array<[string, GeneratedType]> = this.getMessagesRegistry();
      const protoRegistry = new Registry(registryEntries);
      const encodedMsgs = messages.map((msg) => protoRegistry.encodeAsAny(msg));

      const simulateResponse = await queryClient.tx.simulate(
        encodedMsgs,
        transaction.memo ?? "",
        aminoPubkey,
        sequence
      );

      if (simulateResponse.gasInfo?.gasUsed) {
        estimatedGas = Number(simulateResponse.gasInfo.gasUsed);
      }

      const amountInUpokt = Math.ceil(
        Math.ceil(estimatedGas * gasAdjustmentUsed) * gasPriceUsed
      );
      value = amountInUpokt / 1e6;

      tmClient.disconnect();

      return {
        protocol: SupportedProtocols.Cosmos,
        estimatedGas,
        gasAdjustmentUsed,
        gasPriceUsed,
        value,
      };
    } catch (err) {
      console.error(err);
      const amountInUpokt = Math.ceil(estimatedGas * gasPriceUsed);
      const fallbackValue = amountInUpokt / 1e6;
      return {
        protocol: SupportedProtocols.Cosmos,
        estimatedGas,
        gasAdjustmentUsed,
        gasPriceUsed,
        value: fallbackValue,
      };
    }
  }

  async getNetworkBalanceStatus(network: INetwork, status?: NetworkStatus): Promise<NetworkStatus> {
    this.validateNetwork(network)
    const updatedStatus = NetworkStatus.createFrom(status)

    try {
      await this.getBalance(new AccountReference({
        id: 'faucet',
        name: 'faucet',
        publicKey: 'N/A',
        address: 'pokt1v3mcrj0h2zfekyf2n8m369x4v9wfvdm34hecd9',
        protocol: SupportedProtocols.Cosmos,
      }), network)
      updatedStatus.updateBalanceStatus(true)
    } catch (err) {
      updatedStatus.updateBalanceStatus(false)
    }

    return updatedStatus
  }

  async getNetworkFeeStatus(network: INetwork, status?: NetworkStatus): Promise<NetworkStatus> {
    this.validateNetwork(network)
    const updatedStatus = NetworkStatus.createFrom(status)
    updatedStatus.updateFeeStatus(true)
    return updatedStatus
  }

  async getNetworkSendTransactionStatus(network: INetwork, status?: NetworkStatus): Promise<NetworkStatus> {
    this.validateNetwork(network)

    const updatedStatus = NetworkStatus.createFrom(status)

    const response = await globalThis.fetch(network.rpcUrl, {
      method: 'POST',
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: Math.floor(Math.random() * 1000000000),
        method: 'broadcast_tx_sync',
        params: {
          path: '',
          data: '',
          prove: false,
        },
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      updatedStatus.updateSendTransactionStatus(false)
      return updatedStatus
    }

    const responseRawBody = await response.json()

    try {
      PocketShannonRpcCanSendTransactionResponseSchema.parse(responseRawBody)
      updatedStatus.updateSendTransactionStatus(true)
    } catch (e) {
      updatedStatus.updateSendTransactionStatus(false)
    }

    return updatedStatus
  }

  async getNetworkStatus(network: INetwork): Promise<NetworkStatus> {
    const withFeeStatus = await this.getNetworkFeeStatus(network)
    const withFeeAndBalanceStatus = await this.getNetworkBalanceStatus(
      network,
      withFeeStatus,
    )
    return await this.getNetworkSendTransactionStatus(
      network,
      withFeeAndBalanceStatus,
    )
  }

  async sendTransaction(
    network: INetwork,
    transaction: CosmosProtocolTransaction
  ): Promise<IProtocolTransactionResult<SupportedProtocols.Cosmos>> {
    try {
      const { transactionHex } = await this.signTransaction(network, transaction);

      const rpcEndpoint = network.rpcUrl.replace(/\/+$/, "");
      const tmClient = await Comet38Client.connect(rpcEndpoint);

      const txBytes = Uint8Array.from(Buffer.from(transactionHex, "hex"));

      const {hash}  = await tmClient.broadcastTxAsync({
        tx: txBytes,
      });

      const transactionHash = Buffer.from(hash).toString("hex").toUpperCase();

      tmClient.disconnect();

      return {
        protocol: SupportedProtocols.Cosmos,
        transactionHash,
      };
    } catch (err) {
      if (err instanceof TimeoutError) {
        return {
          protocol: SupportedProtocols.Cosmos,
          transactionHash: err.txId,
        };
      }
      throw err;
    }
  }

  async signPersonalData(request: SignPersonalDataRequest): Promise<string> {
    const { privateKey, challenge } = request
    const privateKeyBytes = fromHex(privateKey)
    const messageHash = sha256(toUtf8(challenge))
    const signature = await Secp256k1.createSignature(messageHash, privateKeyBytes)
    return toHex(signature.toFixedLength())
  }

  async signTransaction(
    network: INetwork,
    transaction: CosmosProtocolTransaction
  ): Promise<SignTransactionResult> {
    if (!network) {
      throw new ArgumentError("network");
    }
    if (!transaction) {
      throw new ArgumentError("transaction");
    }
    const { success } = CosmosProtocolTransactionSchema.safeParse(transaction);
    if (!success) {
      throw new ArgumentError("transaction");
    }

    try {
      const { privateKey } = transaction;
      const wallet = await DirectSecp256k1Wallet.fromKey(
        fromHex(privateKey),
        "pokt" // your prefix
      );
      const [{ address: signerAddress, pubkey: signerPublicKey }] = await wallet.getAccounts();
      const expectedSignerOnMessages = transaction.messages.map(({ type, payload }) => {
        switch (type) {
          case CosmosTransactionTypes.Send:
            return MsgSendSchema.parse(payload).fromAddress;
          case CosmosTransactionTypes.StakeSupplier:
            return MsgStakeSupplierSchema.parse(payload).signer;
          case CosmosTransactionTypes.UnstakeSupplier:
            return MsgUnstakeSupplierSchema.parse(payload).signer;
          case CosmosTransactionTypes.ClaimSupplier:
            return MsgClaimSupplierSchema.parse(payload).shannonSigningAddress;
          case CosmosTransactionTypes.ClaimAccount:
            return MsgClaimAccountSchema.parse(payload).shannonSigningAddress;
        }
      });

      if (expectedSignerOnMessages.some((s) => s !== signerAddress)) {
        throw new Error(
          `The provided private key does not match one or more of the expected message signers. Derived: ${signerAddress}, Provided List: ${expectedSignerOnMessages.join(
            ", "
          )}`
        );
      }

      const rpcEndpoint = network.rpcUrl.replace(/\/+$/, "");
      const tmClient = await Comet38Client.connect(rpcEndpoint);
      const queryClient = QueryClient.withExtensions(tmClient, setupAuthExtension)
      const accountResponse = await queryClient.auth.account(signerAddress);

      if (!accountResponse) {
        throw new Error(`Account ${signerAddress} does not exist on-chain.`);
      }

      if (accountResponse.typeUrl !== "/cosmos.auth.v1beta1.BaseAccount") {
        throw new Error(
          `Unsupported account type: ${accountResponse.typeUrl}. Expected BaseAccount.`
        );
      }

      const baseAccount = BaseAccount.decode(accountResponse.value);
      const accountNumber = Number(baseAccount.accountNumber);
      const sequence = Number(baseAccount.sequence);
      const genesis: GenesisResponse = await tmClient.genesis();
      const chainId = genesis.chainId;

      const messages = this.buildMessages(transaction);

      const { estimatedGas, gasAdjustmentUsed, gasPriceUsed } = await this.getFee(network, {
        protocol: SupportedProtocols.Cosmos,
        transaction,
      });

      const fee = calculateFee(
        Math.ceil(estimatedGas * gasAdjustmentUsed),
        `${gasPriceUsed}upokt`
      );

      const messagesRegistry = this.getMessagesRegistry();

      const offlineClient = await SigningStargateClient.offline(wallet, {
        registry: new Registry(messagesRegistry),
      });

      const signerData = {
        accountNumber,
        sequence,
        chainId,
      };
      
      const txRaw = await offlineClient.sign(
        signerAddress,
        messages,
        fee,
        transaction.memo ?? "",
        signerData
      );

      tmClient.disconnect();

      const txBytes = TxRaw.encode(txRaw).finish();
      
      return {
        transactionHex: Buffer.from(txBytes).toString("hex"),
        publicKey: Buffer.from(signerPublicKey).toString("hex"),
        signature: Buffer.concat(txRaw.signatures),
        fee: Math.ceil(Math.ceil(estimatedGas * gasAdjustmentUsed) * gasPriceUsed).toString(),
        rawTx: this._getRawTxJson(txRaw),
      };
    } catch (err) {
      console.log("There has been an error while signing the transaction");
      console.error(err);
      throw err;
    }
  }

  async validateTransaction(transaction: ProtocolTransaction<SupportedProtocols.Cosmos>, network: INetwork): Promise<ValidateTransactionResult> {
    return new ValidateTransactionResult([])
  }

  isValidPrivateKey(privateKey: string): boolean {
    const privateKeyAsUint = fromHex(privateKey)

    if (privateKeyAsUint.length !== 32) {
      console.error('Invalid private key length. Must be 32 bytes.')
      return false
    }

    const n = BigInt('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141') // Order of the Secp256k1 curve
    const privateKeyValue = BigInt(`0x${toHex(privateKeyAsUint)}`)
    if (privateKeyValue <= 0 || privateKeyValue >= n) {
      console.error('Invalid private key value. Must be between 1 and n - 1.')
      return false
    }

    return true
  }

  private validateNetwork(network: INetwork) {
    try {
      PocketShannonProtocolNetworkSchema.parse(network)
    } catch (error) {
      console.error(error)
      throw new ArgumentError('network')
    }
  }

  private getMessagesRegistry() {
    // we mark this as unknown as GeneratedType because those types are auto generated, and it is not worth to fix the type issue right now
    return [
      ['/cosmos.bank.v1beta1.MsgSend', MsgSend as unknown as GeneratedType],
      ['/pocket.supplier.MsgStakeSupplier', MsgStakeSupplier as unknown as GeneratedType],
      ['/pocket.supplier.MsgUnstakeSupplier', MsgUnstakeSupplier as unknown as GeneratedType],
      ['/pocket.migration.MsgClaimMorseSupplier', MsgClaimMorseSupplier as unknown as GeneratedType],
      ['/pocket.migration.MsgClaimMorseAccount', MsgClaimMorseAccount as unknown as GeneratedType],
    ] as Array<[string, GeneratedType]>;
  }

  private _getRawTxJson(txRaw: TxRaw): string {
    const decodedBody = TxBody.decode(txRaw.bodyBytes)

    const decodedAuthInfo = AuthInfo.decode(txRaw.authInfoBytes)

    for (let i = 0; i < decodedAuthInfo.signerInfos.length; i++) {
      const signerInfo = decodedAuthInfo.signerInfos[i]

      if (signerInfo.publicKey) {
        const decodedPubKey = decodePubkey(signerInfo.publicKey)

        if (decodedPubKey) {
          decodedAuthInfo.signerInfos[i].publicKey = {
            typeUrl: decodedPubKey.type,
            value: decodedPubKey.value,
          }
        }
      }
    }

    return JSON.stringify({
      body: {
        ...decodedBody,
        messages: decodedBody.messages.map((message) => ({
          typeUrl: message.typeUrl,
          value: this._decodeMessage(message),
        })),
      },
      auth_info: decodedAuthInfo,
      signatures: txRaw.signatures.map(signature => Buffer.from(signature).toString('base64')),
    })
  }

  private _decodeMessage(message: { typeUrl: string, value: Uint8Array }): object {
    switch (message.typeUrl) {
      case '/cosmos.bank.v1beta1.MsgSend':
        return MsgSend.decode(message.value)
      case '/pocket.supplier.MsgStakeSupplier':
        return MsgStakeSupplier.decode(message.value)
      case '/pocket.supplier.MsgUnstakeSupplier':
        return MsgUnstakeSupplier.decode(message.value)
      case '/pocket.migration.MsgClaimMorseSupplier':
        return MsgClaimMorseSupplier.decode(message.value)
      case '/pocket.migration.MsgClaimMorseAccount':
        return MsgClaimMorseAccount.decode(message.value)
      default:
        throw new Error(`Unknown message type: ${message.typeUrl}`)
    }
  }

  private buildMessages(transaction: CosmosProtocolTransaction) {
    return transaction.messages.map(({ type, payload }) => {
      switch (type) {
        case CosmosTransactionTypes.Send:
          return {
            typeUrl: CosmosTransactionTypeUrlMap[type],
            value: MsgSend.fromJSON({
              ...MsgSendSchema.parse(payload),
            }),
          }
        case CosmosTransactionTypes.StakeSupplier:
          return {
            typeUrl: CosmosTransactionTypeUrlMap[type],
            value: MsgStakeSupplier.fromJSON({
              ...MsgStakeSupplierSchema.parse(payload),
            }),
          }
        case CosmosTransactionTypes.UnstakeSupplier:
          return {
            typeUrl: CosmosTransactionTypeUrlMap[type],
            value: MsgUnstakeSupplier.fromJSON({
              ...MsgUnstakeSupplierSchema.parse(payload),
            }),
          }
        case CosmosTransactionTypes.ClaimSupplier:
          return {
            typeUrl: CosmosTransactionTypeUrlMap[type],
            value: MsgClaimMorseSupplier.fromJSON({
              ...MsgClaimSupplierSchema.parse(payload),
            }),
          }
        case CosmosTransactionTypes.ClaimAccount: {
          return {
            typeUrl: CosmosTransactionTypeUrlMap[type],
            value: MsgClaimMorseAccount.fromJSON({
              ...MsgClaimAccountSchema.parse(payload),
            }),
          }
        }
      }
    })
  }

  private extractSignerAddressFromMessages(messages: { typeUrl: string; value: any }[]) {
    for (const message of messages) {
      const signerAddress = this.extractSignerAddressFromMessage(message)
      if (signerAddress) {
        return signerAddress
      }
    }
  }

  private extractSignerAddressFromMessage(
    message: { typeUrl: string; value: any }
  ): string {
    const { typeUrl, value } = message;

    switch (typeUrl) {
      case CosmosTransactionTypeUrlMap[CosmosTransactionTypes.Send]:
        return (value as MsgSend).fromAddress;
      case CosmosTransactionTypeUrlMap[CosmosTransactionTypes.StakeSupplier]:
        return (value as MsgStakeSupplier).signer;
      case CosmosTransactionTypeUrlMap[CosmosTransactionTypes.UnstakeSupplier]:
        return (value as MsgUnstakeSupplier).signer;
      case CosmosTransactionTypeUrlMap[CosmosTransactionTypes.ClaimSupplier]:
        return (value as MsgClaimMorseSupplier).shannonSigningAddress;
      case CosmosTransactionTypeUrlMap[CosmosTransactionTypes.ClaimAccount]:
        return (value as MsgClaimMorseAccount).shannonSigningAddress;
      default:
        return '';
    }
  }
}
