import {AccountOptions, IProtocolService} from "./IProtocolService";
import {Account} from "../../vault";

export class PocketNetworkProtocolService implements IProtocolService {
  async createAccount(options: AccountOptions): Promise<Account> {
    if (!options.asset) {
       throw new Error('Invalid Operation: Asset instance not provided')
    }

    if (!options.mnemonic) {
        throw new Error('Invalid Operation: Mnemonic phrase not provided')
    }

    if (!options.mnemonic.isValid()) {
        throw new Error('Invalid Operation: Mnemonic phrase is not valid')
    }

    throw new Error('Not implemented')
  }
}
