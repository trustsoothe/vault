import { Account } from "../../vault";
import {AccountReference, Passphrase, SupportedProtocols} from "../values";
import {ProtocolTransferFundsArguments} from "./ProtocolTransferFundsArguments";
import {ProtocolFee} from "./ProtocolFee";
import {IAbstractTransferFundsResult} from "./ProtocolTransferFundsResult";
import {INetwork} from "./INetwork";
import {IAsset} from "./IAsset";
import {NetworkStatus} from "../values/NetworkStatus";
import {IAbstractProtocolFeeRequestOptions} from "./ProtocolFeeRequestOptions";
import {ProtocolTransaction} from "./ProtocolTransaction";

export interface CreateAccountOptions {
  name?: string
  protocol: SupportedProtocols
  passphrase?: Passphrase
  skipEncryption?: boolean
}

export interface CreateAccountFromPrivateKeyOptions extends CreateAccountOptions {
  privateKey: string
}

export interface TransferFundsOptions<T extends SupportedProtocols> {
  from: string;
  to: string;
  amount: number;
  privateKey: string;
  transferArguments: ProtocolTransferFundsArguments<T>;
}

export interface IProtocolService<T extends SupportedProtocols> {
  createAccount(options: CreateAccountOptions): Promise<Account>
  createAccountFromPrivateKey(options: CreateAccountFromPrivateKeyOptions): Promise<Account>
  transferFunds(network: INetwork,  transferOptions: TransferFundsOptions<T>): Promise<IAbstractTransferFundsResult<T>>
  sendTransaction(network: INetwork, transaction: ProtocolTransaction<T>, asset?: IAsset): Promise<IAbstractTransferFundsResult<T>>
  isValidPrivateKey(privateKey: string): boolean
  getNetworkFeeStatus(network: INetwork, status?: NetworkStatus): Promise<NetworkStatus>
  getNetworkBalanceStatus(network: INetwork, status?: NetworkStatus): Promise<NetworkStatus>
  getNetworkSendTransactionStatus(network: INetwork, status?: NetworkStatus): Promise<NetworkStatus>
  getNetworkStatus(network: INetwork): Promise<NetworkStatus>
  getFee(network: INetwork, options?: IAbstractProtocolFeeRequestOptions<T>): Promise<ProtocolFee<T>>
  getBalance(account: AccountReference, network: INetwork, asset?: IAsset): Promise<number>
  getAddressFromPrivateKey(privateKey: string): Promise<string>
}
