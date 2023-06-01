import {Account} from "../../vault";
import {MnemonicPhrase} from "../values";

export interface IProtocolService {
  createAccount(mnemonic?: MnemonicPhrase): Promise<Account>
}
