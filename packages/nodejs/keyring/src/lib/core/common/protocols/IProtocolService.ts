import {Account} from "../../vault";
import {MnemonicPhrase} from "../values";
import {Asset} from "../../asset";

export interface AccountOptions {
  asset: Asset
  mnemonic?: MnemonicPhrase
}

export interface IProtocolService {
  createAccount(options: AccountOptions): Promise<Account>
}
