import {Account} from "../../vault";
import {Passphrase} from "../values";
import {Asset} from "../../asset";

export interface CreateAccountOptions {
  name?: string
  asset: Asset
  passphrase: Passphrase
}

export interface IProtocolService {
  createAccount(options: CreateAccountOptions): Promise<Account>
}
