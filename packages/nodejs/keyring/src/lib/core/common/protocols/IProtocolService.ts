import {Account} from "../../vault";
import {Passphrase} from "../values";
import {Asset} from "../../asset";

export interface CreateAccountOptions {
  asset: Asset,
  passphrase: Passphrase,
}

export interface IProtocolService {
  createAccount(options: CreateAccountOptions): Promise<Account>
}
