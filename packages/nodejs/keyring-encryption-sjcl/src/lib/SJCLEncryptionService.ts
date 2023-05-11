import {IEncryptionService, Passphrase} from "@poktscan/keyring";
import {encrypt, decrypt } from 'sjcl'

export class SJCLEncryptionService implements IEncryptionService {
    decrypt(passphrase: Passphrase, data: string): Promise<string> {
        return decrypt(passphrase.get(), data);
    }

    async encrypt(passphrase: Passphrase, data: string): Promise<string> {
        return encrypt(passphrase.get(), data);
    }
}
