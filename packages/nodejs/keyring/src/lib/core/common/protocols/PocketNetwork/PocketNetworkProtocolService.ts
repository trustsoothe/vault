// @ts-ignore
import {fromUint8Array} from "hex-lite";
import {
  AddHDWalletAccountOptions,
  CreateAccountFromPrivateKeyOptions,
  CreateAccountOptions,
  ImportRecoveryPhraseOptions,
  IProtocolService,
} from "../IProtocolService";
import {Account, AccountType} from "../../../vault";
import {getPublicKeyAsync, signAsync, utils} from "@noble/ed25519";
import {Buffer} from "buffer";
import {IEncryptionService} from "../../encryption/IEncryptionService";
import {AccountReference, SupportedProtocols} from "../../values";
import urlJoin from "url-join";
import {
  PocketProtocolNetworkSchema,
  PocketRpcBalanceResponseSchema,
  PocketRpcCanSendTransactionResponseSchema,
  PocketRpcFeeParamsResponseSchema,
  PocketRpcFeeParamsResponseValue,
} from "./schemas";
import {
  ArgumentError,
  InvalidPrivateKeyError,
  NetworkRequestError,
  ProtocolTransactionError,
  RecoveryPhraseError,
} from "../../../../errors";
import {CoinDenom, MsgProtoSend, TxEncoderFactory, TxSignature,} from "./pocket-js";
import {RawTxRequest} from "@pokt-foundation/pocketjs-types";
import {ProtocolFee} from "../ProtocolFee";
import {INetwork} from "../INetwork";
import {NetworkStatus} from "../../values/NetworkStatus";
import {IAsset} from "../IAsset";
import {IProtocolTransactionResult} from "../ProtocolTransaction";
import {PocketNetworkTransactionTypes} from "./PocketNetworkTransactionTypes";
import {PocketNetworkProtocolTransaction} from "./PocketNetworkProtocolTransaction";
import {derivePath, getMasterKeyFromSeed, getPublicKey} from 'ed25519-hd-key';
import {mnemonicToSeed, validateMnemonic} from '@scure/bip39';
import {wordlist} from "@scure/bip39/wordlists/english";

export class PocketNetworkProtocolService
  implements IProtocolService<SupportedProtocols.Pocket> {
  constructor(private encryptionService: IEncryptionService) {
  }

  async createAccountsFromRecoveryPhrase(options: ImportRecoveryPhraseOptions): Promise<Account[]> {
    const isValidMnemonic = validateMnemonic(options.recoveryPhrase, wordlist)

    if (!isValidMnemonic) {
        throw new RecoveryPhraseError('Invalid recovery phrase')
    }

    const seed = await mnemonicToSeed(options.recoveryPhrase)
    const seedHex = Buffer.from(seed).toString('hex')
    const masterKey = getMasterKeyFromSeed(seedHex)
    const hdSeedAccount = options.isSendNodes
      ? await this.createSendNodesSeedAccountFromKey(masterKey, options)
      : await this.createAccountFromKeyPair(masterKey, options.seedAccountName)

    const hdChildAccount = await this.deriveHDAccountAtIndex(hdSeedAccount, 0)

    return [hdSeedAccount, hdChildAccount]
  }
  async createHDWalletAccount(options: AddHDWalletAccountOptions): Promise<Account[]> {
      throw new Error("Method not implemented.");
  }

  async createAccount(options: CreateAccountOptions): Promise<Account> {
    if (!options.protocol) {
      throw new ArgumentError("options.protocol");
    }

    if (!options.passphrase && !options.skipEncryption) {
      throw new ArgumentError("options.passphrase");
    }

    const shortPrivateKey = utils.randomPrivateKey();
    const publicKey = await getPublicKeyAsync(shortPrivateKey);
    const address = await this.getAddressFromPublicKey(
      Buffer.from(publicKey).toString("hex")
    );
    const privateKey = `${Buffer.from(shortPrivateKey).toString(
      "hex"
    )}${Buffer.from(publicKey).toString("hex")}`;
    let finalPrivateKey = privateKey;

    if (options.passphrase) {
      finalPrivateKey = await this.encryptionService.encrypt(
        options.passphrase,
        privateKey
      );
    }

    return new Account({
      protocol: options.protocol,
      name: options.name,
      address,
      publicKey: Buffer.from(publicKey).toString("hex"),
      privateKey: finalPrivateKey,
      secure: !options.skipEncryption,
    });
  }

  async createAccountFromPrivateKey(
    options: CreateAccountFromPrivateKeyOptions
  ): Promise<Account> {
    if (!options.protocol) {
      throw new ArgumentError("options.protocol");
    }

    if (!options.passphrase && !options.skipEncryption) {
      throw new ArgumentError("options.passphrase");
    }

    if (!options.privateKey) {
      throw new ArgumentError("options.privateKey");
    }

    if (!this.isValidPrivateKey(options.privateKey)) {
      throw new InvalidPrivateKeyError(options.privateKey);
    }

    const publicKey = this.getPublicKeyFromPrivateKey(options.privateKey);
    const address = await this.getAddressFromPublicKey(publicKey);
    let finalPrivateKey = options.privateKey;
    if (options.passphrase) {
      finalPrivateKey = await this.encryptionService.encrypt(
        options.passphrase,
        options.privateKey
      );
    }

    return new Account({
      name: options.name,
      protocol: options.protocol,
      address,
      publicKey,
      privateKey: finalPrivateKey,
      secure: !options.skipEncryption,
    });
  }

  async getNetworkFeeStatus(
    network: INetwork,
    status?: NetworkStatus
  ): Promise<NetworkStatus> {
    this.validateNetwork(network);

    const updatedStatus = NetworkStatus.createFrom(status);

    const response = await this.requestFee(network);

    if (!response.ok) {
      updatedStatus.updateFeeStatus(false);
      return updatedStatus;
    }

    const responseRawBody = await response.json();

    try {
      PocketRpcFeeParamsResponseSchema.parse(responseRawBody);
      updatedStatus.updateFeeStatus(true);
    } catch {
      updatedStatus.updateFeeStatus(false);
    }

    return updatedStatus;
  }

  async getNetworkBalanceStatus(
    network: INetwork,
    status?: NetworkStatus
  ): Promise<NetworkStatus> {
    this.validateNetwork(network);

    const updatedStatus = NetworkStatus.createFrom(status);

    const url = urlJoin(network.rpcUrl, "v1/query/balance");

    const response = await globalThis.fetch(url, {
      method: "POST",
    });

    if (!response.ok) {
      updatedStatus.updateBalanceStatus(false);
      return updatedStatus;
    }

    const responseRawBody = await response.json();

    try {
      PocketRpcBalanceResponseSchema.parse(responseRawBody);
      updatedStatus.updateBalanceStatus(true);
    } catch {
      updatedStatus.updateBalanceStatus(false);
    }

    return updatedStatus;
  }

  async getNetworkSendTransactionStatus(
    network: INetwork,
    status?: NetworkStatus
  ): Promise<NetworkStatus> {
    this.validateNetwork(network);

    const updatedStatus = NetworkStatus.createFrom(status);

    const url = urlJoin(network.rpcUrl, "v1/client/rawtx");

    const response = await globalThis.fetch(url, {
      method: "POST",
    });

    if (!response.ok) {
      updatedStatus.updateSendTransactionStatus(false);
      return updatedStatus;
    }

    const responseRawBody = await response.json();

    try {
      PocketRpcCanSendTransactionResponseSchema.parse(responseRawBody);
      updatedStatus.updateSendTransactionStatus(true);
    } catch (e) {
      updatedStatus.updateSendTransactionStatus(false);
    }

    return updatedStatus;
  }

  async getNetworkStatus(network: INetwork): Promise<NetworkStatus> {
    const withFeeStatus = await this.getNetworkFeeStatus(network);
    const withFeeAndBalanceStatus = await this.getNetworkBalanceStatus(
      network,
      withFeeStatus
    );
    return await this.getNetworkSendTransactionStatus(
      network,
      withFeeAndBalanceStatus
    );
  }

  async getBalance(
    account: AccountReference,
    network: INetwork,
    asset?: IAsset
  ): Promise<number> {
    this.validateNetwork(network);

    const url = urlJoin(network.rpcUrl, "v1/query/balance");

    const response = await globalThis.fetch(url, {
      method: "POST",
      body: JSON.stringify({
        address: account.address,
      }),
    });

    if (!response.ok) {
      throw new NetworkRequestError("Failed to fetch balance");
    }

    const responseRawBody = await response.json();
    const balanceResponse =
      PocketRpcBalanceResponseSchema.parse(responseRawBody);
    return balanceResponse.balance;
  }

  async getFee(
    network: INetwork
  ): Promise<ProtocolFee<SupportedProtocols.Pocket>> {
    this.validateNetwork(network);
    const response = await this.requestFee(network);

    if (!response.ok) {
      throw new NetworkRequestError("Failed to fetch fee");
    }

    const responseRawBody = await response.json();

    const feeResponse = PocketRpcFeeParamsResponseValue.parse(responseRawBody);

    return {
      protocol: SupportedProtocols.Pocket,
      value: feeResponse.param_value.fee_multiplier,
    };
  }

  async sendTransaction(
    network: INetwork,
    transaction: PocketNetworkProtocolTransaction
  ): Promise<IProtocolTransactionResult<SupportedProtocols.Pocket>> {
    switch (transaction.transactionType) {
      case PocketNetworkTransactionTypes.Send:
        return await this.executeSendTransaction(
          network,
          transaction as PocketNetworkProtocolTransaction
        );
      default:
        throw new ProtocolTransactionError(
          "Unsupported transaction type. Not implemented."
        );
    }
  }

  async getTransactionByHash(network: INetwork, hash: string) {
    this.validateNetwork(network);

    const url = urlJoin(network.rpcUrl, "v1/query/tx");

    const response = await globalThis.fetch(url, {
      method: "POST",
      body: JSON.stringify({
        hash,
      }),
    });

    if (!response.ok) {
      throw new NetworkRequestError("Failed to fetch transaction");
    }

    return await response.json();
  }

  isValidPrivateKey(privateKey: string): boolean {
    return /^[0-9A-Fa-f]{128}$/.test(privateKey);
  }

  private async createAccountFromKeyPair(masterKey: { key: Buffer }, name?: string, accountType: AccountType = AccountType.HDSeed, hdwAccountIndex?: number, hdwIndex?: number, parentId?: string): Promise<Account> {
    const publicKey = getPublicKey(masterKey.key, false).toString('hex')
    const address = await this.getAddressFromPublicKey(publicKey)
    return new Account({
      address,
      publicKey,
      accountType,
      parentId,
      hdwAccountIndex,
      hdwIndex,
      name: name || "HD Account",
      protocol: SupportedProtocols.Pocket,
      privateKey: masterKey.key.toString('hex'),
      secure: false,
    })
  }

  private async createSendNodesSeedAccountFromKey(masterKey: { key: Buffer }, options: ImportRecoveryPhraseOptions): Promise<Account> {
    const sendNodesKey = derivePath('m/44\'/635\'/0\'/0\'', masterKey.key.toString('hex'))
    return this.createAccountFromKeyPair(sendNodesKey, options.seedAccountName)
  }

  private async deriveHDAccountAtIndex(seedAccount: Account, index: number): Promise<Account> {
    const derivedKeys = derivePath(`m/44'/635'/0'/0'/${index}'`, seedAccount.privateKey)
    return this.createAccountFromKeyPair(derivedKeys, `${seedAccount.name} ${index + 1}`, AccountType.HDChild, 0, index, seedAccount.id)
  }

  private validateNetwork(network: INetwork) {
    try {
      PocketProtocolNetworkSchema.parse(network);
    } catch {
      throw new ArgumentError("network");
    }
  }

  private async requestFee(network: INetwork) {
    const FEE_PARAM_KEY = "auth/FeeMultipliers";

    const url = urlJoin(network.rpcUrl, "v1/query/param");

    // @ts-ignore
    return await globalThis.fetch(url, {
      method: "POST",
      body: JSON.stringify({
        key: FEE_PARAM_KEY,
      }),
    });
  }

  public async getAddressFromPrivateKey(privateKey: string): Promise<string> {
    const publicKey = this.getPublicKeyFromPrivateKey(privateKey);

    return this.getAddressFromPublicKey(publicKey);
  }

  private getPublicKeyFromPrivateKey(privateKey: string): string {
    return privateKey.slice(64, privateKey.length);
  }

  private async getAddressFromPublicKey(publicKey: string): Promise<string> {
    // @ts-ignore
    const hash = await globalThis.crypto.subtle.digest(
      {
        name: "SHA-256",
      },
      this.hexStringToByteArray(publicKey)
    );

    return fromUint8Array(new Uint8Array(hash)).slice(0, 40);
  }

  private hexStringToByteArray(str: string): Uint8Array {
    const hexRegExp = str.match(/.{1,2}/g);

    if (hexRegExp) {
      return Uint8Array.from(hexRegExp.map((byte) => parseInt(byte, 16)));
    }

    throw new Error("Invalid hex string");
  }

  private async executeSendTransaction(
    network: INetwork,
    transactionParams: PocketNetworkProtocolTransaction
  ): Promise<IProtocolTransactionResult<SupportedProtocols.Pocket>> {
    const txMsg = new MsgProtoSend(
      transactionParams.from,
      transactionParams.to,
      (Number(transactionParams.amount) * 1e6).toString()
    );

    const entropy = Number(
      BigInt(Math.floor(Math.random() * Number.MAX_SAFE_INTEGER)).toString()
    ).toString();

    let fee = transactionParams.fee ? transactionParams.fee * 1e6 : undefined;

    if (!fee) {
      const feeResponse = await this.getFee(network);
      fee = feeResponse.value;
    }

    const signer = TxEncoderFactory.createEncoder(
      entropy,
      network.chainID,
      txMsg,
      fee.toString(),
      CoinDenom.Upokt,
      transactionParams.memo || ""
    );

    const bytesToSign = signer.marshalStdSignDoc();

    const txBytes = await signAsync(
      bytesToSign.toString("hex"),
      transactionParams.privateKey.slice(0, 64)
    );

    const marshalledTx = new TxSignature(
      Buffer.from(
        this.getPublicKeyFromPrivateKey(transactionParams.privateKey),
        "hex"
      ),
      Buffer.from(txBytes)
    );

    const rawHexBytes = signer.marshalStdTx(marshalledTx).toString("hex");

    const rawTx = new RawTxRequest(transactionParams.from, rawHexBytes);

    const url = urlJoin(network.rpcUrl, "v1/client/rawtx");

    const response = await globalThis.fetch(url, {
      method: "POST",
      body: JSON.stringify(rawTx.toJSON()),
    });

    if (!response.ok) {
      const responseText = await response.text();
      throw new NetworkRequestError(
        "Failed when sending transaction at the network level.",
        new Error(responseText)
      );
    }

    const responseRawBody = await response.json();

    if (responseRawBody.code || responseRawBody.raw_log) {
      throw new ProtocolTransactionError(
        "Failed to send transaction at the protocol level",
        new Error(responseRawBody.raw_log)
      );
    }

    return {
      protocol: SupportedProtocols.Pocket,
      transactionHash: responseRawBody.txhash,
    };
  }
}
