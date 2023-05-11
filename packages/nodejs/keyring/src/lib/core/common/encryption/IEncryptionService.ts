import {Passphrase} from "../values/Passphrase";

export default interface IEncryptionService {
  encrypt(passphrase: Passphrase, data: string): Promise<string>
  decrypt(passphrase: Passphrase, data: string): Promise<string>
}
