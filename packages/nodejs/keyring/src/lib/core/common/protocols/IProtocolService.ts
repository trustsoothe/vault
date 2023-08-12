import {Account} from "../../vault";
import {AccountReference, Passphrase} from "../values";
import {Asset} from "../../asset";
import {Network} from "../../network";

export interface CreateAccountOptions {
  name?: string
  asset: Asset
  passphrase?: Passphrase
  skipEncryption?: boolean
}

export interface CreateAccountFromPrivateKeyOptions extends CreateAccountOptions {
  privateKey: string
}

export interface CreateAccountFromPPKFileOptions extends CreateAccountOptions {
  ppkFileContent: string
  ppkFilePassphrase: Passphrase
}

export interface IProtocolService {
  createAccount(options: CreateAccountOptions): Promise<Account>
  createAccountFromPrivateKey(options: CreateAccountFromPrivateKeyOptions): Promise<Account>
  createAccountFromPPKFile(options: CreateAccountFromPPKFileOptions): Promise<Account>
  isValidPPKFileStructure(fileContent: string): boolean
  updateFeeStatus(network: Network): Promise<Network>
  updateBalanceStatus(network: Network): Promise<Network>
  updateSendTransactionStatus(network: Network): Promise<Network>
  updateNetworkStatus(network: Network): Promise<Network>
  getFee(network: Network): Promise<number>
  getBalance(network: Network, account: AccountReference): Promise<number>
}
