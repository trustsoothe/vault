import { Account } from "../../vault";
import {AccountReference, Passphrase, SupportedProtocols} from "../values";
import { Asset } from "../../asset";
import { Network } from "../../network";
import {ProtocolTransferFundsArguments} from "./ProtocolTransferFundsArguments";
import {ProtocolFee} from "./ProtocolFee";
import {IAbstractTransferFundsResult} from "./ProtocolTransferFundsResult";

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
  transferFunds(network: Network<T>,  transferOptions: TransferFundsOptions<T>): Promise<IAbstractTransferFundsResult<T>>
  isValidPrivateKey(privateKey: string): boolean
  updateFeeStatus(network: Network<T>): Promise<Network<T>>
  updateBalanceStatus(network: Network<T>): Promise<Network<T>>
  updateSendTransactionStatus(network: Network<T>): Promise<Network<T>>
  updateNetworkStatus(network: Network<T>): Promise<Network<T>>
  getFee(network: Network<T>): Promise<ProtocolFee<T>>
  getBalance(network: Network<T>, account: AccountReference): Promise<number>
  getAddressFromPrivateKey(privateKey: string): Promise<string>
}
