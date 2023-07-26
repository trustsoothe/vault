import {Account} from "../../vault";
import {AccountReference, Passphrase} from "../values";
import {Asset} from "../../asset";
import {Network} from "../../network";

export interface CreateAccountOptions {
  name?: string
  asset: Asset
  passphrase: Passphrase
}

export interface IProtocolService {
  createAccount(options: CreateAccountOptions): Promise<Account>
  updateNetworkStatus(network: Network): Promise<Network>
  getFee(network: Network): Promise<number>
  getBalance(network: Network, account: AccountReference): Promise<number>
}
