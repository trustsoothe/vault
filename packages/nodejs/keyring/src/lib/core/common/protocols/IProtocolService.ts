import { Account } from "../../vault";
import { AccountReference, Passphrase } from "../values";
import { Asset } from "../../asset";
import { Network } from "../../network";
import {Protocol} from "../Protocol";
import {IProtocolTransferArguments} from "../IProtocolTransferArguments";

export interface CreateAccountOptions {
  name?: string
  asset: Asset
  passphrase?: Passphrase
  skipEncryption?: boolean
}

export interface CreateAccountFromPrivateKeyOptions extends CreateAccountOptions {
  privateKey: string
}

export interface TransferFundsOptions<T extends Protocol> {
  from: string;
  to: string;
  amount: number;
  privateKey: string;
  transferArguments: IProtocolTransferArguments<T>;
}

export interface ITransferFundsResult<T extends Protocol> {
  protocol: T;
}

export interface IProtocolService<T extends Protocol> {
  createAccount(options: CreateAccountOptions): Promise<Account>
  createAccountFromPrivateKey(options: CreateAccountFromPrivateKeyOptions): Promise<Account>
  transferFunds(network: Network,  transferOptions: TransferFundsOptions<T>): Promise<ITransferFundsResult<T>>
  isValidPrivateKey(privateKey: string): boolean
  updateFeeStatus(network: Network): Promise<Network>
  updateBalanceStatus(network: Network): Promise<Network>
  updateSendTransactionStatus(network: Network): Promise<Network>
  updateNetworkStatus(network: Network): Promise<Network>
  getFee(network: Network): Promise<number>
  getBalance(network: Network, account: AccountReference): Promise<number>
}
