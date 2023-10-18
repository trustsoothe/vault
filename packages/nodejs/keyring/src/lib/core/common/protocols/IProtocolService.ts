import { Account } from "../../vault";
import {AccountReference, Passphrase, SupportedProtocols} from "../values";
import { Asset } from "../../asset";
import {ProtocolTransferFundsArguments} from "./ProtocolTransferFundsArguments";
import {ProtocolFee} from "./ProtocolFee";
import {IAbstractTransferFundsResult} from "./ProtocolTransferFundsResult";
import {INetwork} from "./INetwork";
import {IAsset} from "./IAsset";
import {NetworkStatus} from "../values/NetworkStatus";

export interface CreateAccountOptions {
  name?: string
  asset: Asset
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
  isValidPrivateKey(privateKey: string): boolean
  getNetworkFeeStatus(network: INetwork, status?: NetworkStatus): Promise<NetworkStatus>
  getNetworkBalanceStatus(network: INetwork, status?: NetworkStatus): Promise<NetworkStatus>
  getNetworkSendTransactionStatus(network: INetwork, status?: NetworkStatus): Promise<NetworkStatus>
  getNetworkStatus(network: INetwork): Promise<NetworkStatus>
  getFee(network: INetwork): Promise<ProtocolFee<T>>
  getBalance(account: AccountReference, network: INetwork, asset?: IAsset): Promise<number>
  getAddressFromPrivateKey(privateKey: string): Promise<string>
}
