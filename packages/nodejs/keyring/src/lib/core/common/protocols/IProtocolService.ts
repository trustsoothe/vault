import { Account } from "../../vault";
import {AccountReference, Passphrase, SupportedProtocols} from "../values";
import {ProtocolFee} from "./ProtocolFee";
import {INetwork} from "./INetwork";
import {IAsset} from "./IAsset";
import {NetworkStatus} from "../values/NetworkStatus";
import {IAbstractProtocolFeeRequestOptions} from "./ProtocolFeeRequestOptions";
import {IProtocolTransactionResult, ProtocolTransaction} from "./ProtocolTransaction";

export interface CreateAccountOptions {
  name?: string
  protocol: SupportedProtocols
  passphrase?: Passphrase
  skipEncryption?: boolean
}

export interface CreateAccountFromPrivateKeyOptions extends CreateAccountOptions {
  privateKey: string
}

export interface ImportRecoveryPhraseOptions {
  recoveryPhrase: string;
  protocol: SupportedProtocols;
  seedAccountName?: string;
  passphrase?: string;
  isSendNodes?: boolean;
}

export interface AddHDWalletAccountOptions {
  seedAccountId: string;
  count?: number;
}

export interface IProtocolService<T extends SupportedProtocols> {
  createAccount(options: CreateAccountOptions): Promise<Account>
  createAccountFromPrivateKey(options: CreateAccountFromPrivateKeyOptions): Promise<Account>
  sendTransaction(network: INetwork, transaction: ProtocolTransaction<T>, asset?: IAsset): Promise<IProtocolTransactionResult<T>>
  isValidPrivateKey(privateKey: string): boolean
  getNetworkFeeStatus(network: INetwork, status?: NetworkStatus): Promise<NetworkStatus>
  getNetworkBalanceStatus(network: INetwork, status?: NetworkStatus): Promise<NetworkStatus>
  getNetworkSendTransactionStatus(network: INetwork, status?: NetworkStatus): Promise<NetworkStatus>
  getNetworkStatus(network: INetwork): Promise<NetworkStatus>
  getFee(network: INetwork, options?: IAbstractProtocolFeeRequestOptions<T>): Promise<ProtocolFee<T>>
  getBalance(account: AccountReference, network: INetwork, asset?: IAsset): Promise<number>
  getAddressFromPrivateKey(privateKey: string): Promise<string>
  createAccountsFromRecoveryPhrase(options: ImportRecoveryPhraseOptions): Promise<Account[]>
  createHDWalletAccount(options: AddHDWalletAccountOptions): Promise<Account[]>
}
