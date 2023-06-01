import {Account} from "../../vault";
import {MnemonicPhrase} from "../values";
import {Asset} from "../../asset";

export interface IProtocolService {
  createAccount(asset: Asset, mnemonic?: MnemonicPhrase): Promise<Account>
}
