// @ts-ignore
import {fromUint8Array} from "hex-lite";
import {
  AddHDWalletAccountOptions,
  CreateAccountFromPrivateKeyOptions,
  CreateAccountOptions,
  ImportRecoveryPhraseOptions,
  IProtocolService,
  SignPersonalDataRequest,
  SignTransactionResult,
  TransactionValidationResultType,
  ValidateTransactionResult,
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
import {
  CoinDenom,
  MsgProtoAppStake,
  MsgProtoAppTransfer,
  MsgProtoAppUnstake,
  MsgProtoGovChangeParam,
  MsgProtoGovDAOTransfer,
  MsgProtoNodeStakeTx,
  MsgProtoNodeUnjail,
  MsgProtoNodeUnstake,
  MsgProtoSend,
  TxEncoderFactory,
  TxSignature,
} from "./pocket-js";
import {RawTxRequest} from "@pokt-foundation/pocketjs-types";
import {ProtocolFee} from "../ProtocolFee";
import {INetwork} from "../INetwork";
import {NetworkStatus} from "../../values/NetworkStatus";
import {IProtocolTransactionResult, ProtocolTransaction} from "../ProtocolTransaction";
import {PocketNetworkTransactionTypes} from "./PocketNetworkTransactionTypes";
import {
  PocketNetworkProtocolTransaction,
  PocketNetworkTransactionValidationResults
} from "./PocketNetworkProtocolTransaction";
import {derivePath, getMasterKeyFromSeed, getPublicKey} from "ed25519-hd-key";
import {mnemonicToSeed, validateMnemonic} from "@scure/bip39";
import {wordlist} from "@scure/bip39/wordlists/english";

interface CrateAccountFromKeyPairOptions {
  key: Buffer;
  name?: string;
  accountType?: AccountType;
  hdwAccountIndex?: number;
  hdwIndex?: number;
  parentId?: string;
  seedId?: string;
  concatPublicKey?: boolean;
}

export class PocketNetworkProtocolService
    implements IProtocolService<SupportedProtocols.Pocket> {
  constructor(private encryptionService: IEncryptionService) {
  }

  async createAccountsFromRecoveryPhrase(
    options: ImportRecoveryPhraseOptions
  ): Promise<Account[]> {
    const isValidMnemonic = validateMnemonic(options.recoveryPhrase, wordlist);

    if (!isValidMnemonic) {
      throw new RecoveryPhraseError("Invalid recovery phrase");
    }

    const seed = await mnemonicToSeed(
      options.recoveryPhrase,
      options.passphrase
    );
    const seedHex = Buffer.from(seed).toString("hex");
    const masterKey = getMasterKeyFromSeed(seedHex);
    const hdSeedAccount = options.isSendNodes
      ? await this.createSendNodesSeedAccountFromKey(masterKey, options)
      : await this.createAccountFromKeyPair({
          key: masterKey.key,
          name: options.seedAccountName,
          seedId: options.recoveryPhraseId,
          accountType: AccountType.HDSeed,
          hdwAccountIndex: 0,
          hdwIndex: 0,
          concatPublicKey: false,
      });

    const hdChildAccount = await this.deriveHDAccountAtIndex(hdSeedAccount, 0);

    return [hdSeedAccount, hdChildAccount];
  }

  async createHDWalletAccount(
    options: AddHDWalletAccountOptions
  ): Promise<Account> {
    return this.deriveHDAccountAtIndex(
      options.seedAccount,
      options.index,
      options.name
    );
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
    const signatureResult = await this.signTransaction(network, transaction);

    const rawTx = new RawTxRequest(transaction.from, signatureResult.transactionHex);

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

  async signPersonalData(request: SignPersonalDataRequest): Promise<string> {
    const bytesToSign = Buffer.from(request.challenge, "utf-8").toString("hex");
    const txBytes = await signAsync(
        bytesToSign,
        request.privateKey.slice(0, 64)
    );
    return Buffer.from(txBytes).toString("hex");
  }

  async getAddressFromPrivateKey(privateKey: string): Promise<string> {
    const publicKey = this.getPublicKeyFromPrivateKey(privateKey);

    return this.getAddressFromPublicKey(publicKey);
  }

  async signTransaction(network: INetwork, transactionParams: PocketNetworkProtocolTransaction): Promise<SignTransactionResult> {
    const txMsg = await this.buildTransactionMessage(transactionParams);

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

    const signature = await signAsync(
        bytesToSign.toString("hex"),
        transactionParams.privateKey.slice(0, 64)
    );

    const marshalledTx = new TxSignature(
        Buffer.from(
            this.getPublicKeyFromPrivateKey(transactionParams.privateKey),
            "hex"
        ),
        Buffer.from(signature)
    );

    const transactionHex = signer.marshalStdTx(marshalledTx).toString("hex");

    return {
      signature: Buffer.from(signature),
      transactionHex,
      publicKey: this.getPublicKeyFromPrivateKey(transactionParams.privateKey),
    }
  }

  isValidPrivateKey(privateKey: string): boolean {
    return /^[0-9A-Fa-f]{128}$/.test(privateKey);
  }

  async validateTransaction(
      transaction: ProtocolTransaction<SupportedProtocols.Pocket>,
      network: INetwork,
  ) {
    if (!transaction) {
        throw new ArgumentError("transaction params are required");
    }

    if (!network) {
        throw new ArgumentError("network is required");
    }

    if (transaction.skipValidation) {
        return new ValidateTransactionResult();
    }

    switch (transaction.transactionType) {
      case PocketNetworkTransactionTypes.NodeStake:
        return this.validateNodeStakeTransaction(transaction, network);
      default:
        return new ValidateTransactionResult();
    }
  }

  private async queryNode(address: string, network: INetwork) {
    let response;

    const url = urlJoin(network.rpcUrl, "v1/query/node");

    try {
      response = await globalThis.fetch(url, {
          method: "POST",
          body: JSON.stringify({
              address,
          }),
      });
    } catch (e) {
        throw new NetworkRequestError("Failed to query node");
    }

    if (!response.ok) {
        throw new NetworkRequestError("Failed to query node");
    }

    return await response.json();
  }

  private async validateNodeStakeTransaction(
      transaction: PocketNetworkProtocolTransaction,
      network: INetwork
  ) {
    const node = await this.queryNode(transaction.from, network);
    const expectedPublicKey = this.getPublicKeyFromPrivateKey(transaction.privateKey);
    const expectedAddress = await this.getAddressFromPublicKey(expectedPublicKey);



    if (![transaction.from, transaction.outputAddress || ''].includes(expectedAddress)) {
      return new ValidateTransactionResult([
        {
          type: TransactionValidationResultType.Error,
          message: PocketNetworkTransactionValidationResults.InvalidSigner,
          key: "privateKey",
        },
      ]);
    }


    if (transaction.outputAddress && transaction.outputAddress !== node.output_address) {
        return new ValidateTransactionResult([
            {
              type: TransactionValidationResultType.Info,
              message: PocketNetworkTransactionValidationResults.OutputAddressChanged,
              key: "outputAddress",
            },
        ]);
    }


    return new ValidateTransactionResult();
  }

  private async createAccountFromKeyPair(
    options: CrateAccountFromKeyPairOptions
  ): Promise<Account> {
    const publicKey = getPublicKey(options.key, false).toString("hex");
    const address = await this.getAddressFromPublicKey(publicKey);
    return new Account({
      address,
      publicKey,
      accountType: options.accountType,
      parentId: options.parentId,
      hdwAccountIndex: options.hdwAccountIndex,
      hdwIndex: options.hdwIndex,
      name: options.name || "HD Account",
      seedId: options.seedId,
      protocol: SupportedProtocols.Pocket,
      privateKey: options.concatPublicKey
          ? `${options.key.toString("hex")}${publicKey}`
          : options.key.toString("hex"),
      secure: false,
    });
  }

  private async createSendNodesSeedAccountFromKey(
    masterKey: {
      key: Buffer;
    },
    options: ImportRecoveryPhraseOptions
  ): Promise<Account> {
    const sendNodesKey = derivePath(
      "m/44'/635'/0'/0'",
      masterKey.key.toString("hex")
    );
    return this.createAccountFromKeyPair({
      key: sendNodesKey.key,
      name: options.seedAccountName,
      concatPublicKey: false,
      seedId: options.recoveryPhraseId,
    });
  }

  private async deriveHDAccountAtIndex(
    seedAccount: Account,
    index: number,
    name?: string
  ): Promise<Account> {
    const derivedKeys = derivePath(
      `m/44'/635'/0'/0'/${index}'`,
      seedAccount.privateKey
    );

    return this.createAccountFromKeyPair({
      key: derivedKeys.key,
      name: name ? name : `${seedAccount.name} ${index + 1}`,
      seedId: '',
      accountType: AccountType.HDChild,
      hdwAccountIndex: 0,
      hdwIndex: index,
      parentId: seedAccount.id,
      concatPublicKey: true,
    });
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

  private getAmountInUpokt(amount: string): string {
    return (Number(amount) * 1e6).toString();
  }

  private async buildTransactionMessage(transactionParams: PocketNetworkProtocolTransaction) {
    const publicKey = this.getPublicKeyFromPrivateKey(transactionParams.privateKey).toString();
     switch (transactionParams.transactionType) {
        case PocketNetworkTransactionTypes.Send:
            return new MsgProtoSend(
                transactionParams.from,
                transactionParams.to,
                this.getAmountInUpokt(transactionParams.amount),
            );
        case PocketNetworkTransactionTypes.AppStake:
          return new MsgProtoAppStake(
              transactionParams.appPublicKey || '',
              transactionParams.chains || [],
              this.getAmountInUpokt(transactionParams.amount),
          );
        case PocketNetworkTransactionTypes.AppTransfer:
          return new MsgProtoAppTransfer(transactionParams.appPublicKey || '');
        case PocketNetworkTransactionTypes.AppUnstake:
          return new MsgProtoAppUnstake(transactionParams.appAddress || '');
        case PocketNetworkTransactionTypes.NodeStake:
          return new MsgProtoNodeStakeTx(
              transactionParams.nodePublicKey || publicKey,
              transactionParams.outputAddress || await this.getAddressFromPublicKey(transactionParams.nodePublicKey || publicKey),
              transactionParams.chains || [],
              this.getAmountInUpokt(transactionParams.amount),
              new URL(transactionParams.serviceURL || ''),
              transactionParams.rewardDelegators,
          );
       case PocketNetworkTransactionTypes.NodeUnjail:
          return new MsgProtoNodeUnjail(transactionParams.from, transactionParams.outputAddress || transactionParams.from);
        case PocketNetworkTransactionTypes.NodeUnstake:
          return new MsgProtoNodeUnstake(transactionParams.from, transactionParams.outputAddress || transactionParams.from);
        case PocketNetworkTransactionTypes.GovChangeParam:
          return new MsgProtoGovChangeParam(
              transactionParams.from,
              transactionParams.paramKey!,
              transactionParams.paramValue!,
              transactionParams.overrideGovParamsWhitelistValidation,
          );
        case PocketNetworkTransactionTypes.GovDAOTransfer:
          return new MsgProtoGovDAOTransfer(
              transactionParams.from,
              transactionParams.to,
              transactionParams.amount,
              transactionParams.daoAction!,
          );
        default:
            throw new ProtocolTransactionError(
            "Unsupported transaction type. Not implemented."
            );
     }
  }
}
