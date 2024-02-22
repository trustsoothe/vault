import {Passphrase} from "../values";

export interface IEncryptionService {
  encrypt(passphrase: Passphrase, data: string): Promise<string>
  decrypt(passphrase: Passphrase, data: string): Promise<string>
}
