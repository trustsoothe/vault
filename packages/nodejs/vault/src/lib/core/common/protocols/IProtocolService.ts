import { Account } from '../../vault'
import { AccountReference, Passphrase, SupportedProtocols } from '../values'
import { ProtocolFee } from './ProtocolFee'
import { INetwork } from './INetwork'
import { IAsset } from './IAsset'
import { NetworkStatus } from '../values/NetworkStatus'
import { IAbstractProtocolFeeRequestOptions } from './ProtocolFeeRequestOptions'
import { IProtocolTransactionResult, ProtocolTransaction } from './ProtocolTransaction'

export interface CreateAccountOptions {
  name?: string;
  protocol: SupportedProtocols;
  passphrase?: Passphrase;
  skipEncryption?: boolean;
  addressPrefix?: string;
}

export interface CreateAccountFromPrivateKeyOptions
  extends CreateAccountOptions {
  privateKey: string;
}

export interface ImportRecoveryPhraseOptions {
  recoveryPhrase: string;
  recoveryPhraseId: string;
  protocol: SupportedProtocols;
  seedAccountName?: string;
  passphrase?: string;
  isSendNodes?: boolean;
  addressPrefix?: string;
}

export interface AddHDWalletAccountOptions {
  seedAccount: Account;
  index: number;
  name?: string;
  addressPrefix?: string;
}

export interface SignPersonalDataRequest {
  challenge: string;
  privateKey: string;
}

export interface SignTransactionResult {
  signature: Buffer;
  publicKey: string;
  transactionHex: string;
  fee?: string
  estimatedGas?: number;
  gasAdjustment?: number;
  gasPrice?: number;
  rawTx?: string
}

export interface PublicKeyResult {
  publicKey: string;
}

export enum TransactionValidationResultType {
  Error = 'error',
  Warning = 'warning',
  Info = 'info',
}

export class ValidateTransactionResult {
  constructor(
    public readonly results: ReadonlyArray<TransactionValidationResult> = [],
  ) {
  }

  get hasErrors(): boolean {
    return this.results.some((r) => r.type === TransactionValidationResultType.Error)
  }
}

export interface TransactionValidationResult {
  type: TransactionValidationResultType;
  message: string;
  key?: string;
}

export interface DeriveAddressOptions {
  privateKey: string;
  addressPrefix?: string;
}

export interface IProtocolService<T extends SupportedProtocols> {
  createAccount(options: CreateAccountOptions): Promise<Account>;

  createAccountFromPrivateKey(
    options: CreateAccountFromPrivateKeyOptions,
  ): Promise<Account>;

  sendTransaction(
    network: INetwork,
    transaction: ProtocolTransaction<T>,
    asset?: IAsset,
  ): Promise<IProtocolTransactionResult<T>>;

  isValidPrivateKey(privateKey: string): boolean;

  getNetworkFeeStatus(
    network: INetwork,
    status?: NetworkStatus,
  ): Promise<NetworkStatus>;

  getNetworkBalanceStatus(
    network: INetwork,
    status?: NetworkStatus,
  ): Promise<NetworkStatus>;

  getNetworkSendTransactionStatus(
    network: INetwork,
    status?: NetworkStatus,
  ): Promise<NetworkStatus>;

  getNetworkStatus(network: INetwork): Promise<NetworkStatus>;

  getFee(
    network: INetwork,
    options?: IAbstractProtocolFeeRequestOptions<T>,
  ): Promise<ProtocolFee<T>>;

  getBalance(
    account: AccountReference,
    network: INetwork,
    asset?: IAsset,
  ): Promise<number>;

  getAddressFromPrivateKey(options: DeriveAddressOptions): Promise<string>;

  createAccountsFromRecoveryPhrase(
    options: ImportRecoveryPhraseOptions,
  ): Promise<Account[]>;

  createHDWalletAccount(options: AddHDWalletAccountOptions): Promise<Account>;

  signPersonalData(request: SignPersonalDataRequest): Promise<string>;

  validateTransaction(transaction: ProtocolTransaction<T>, network: INetwork): Promise<ValidateTransactionResult>;
}
