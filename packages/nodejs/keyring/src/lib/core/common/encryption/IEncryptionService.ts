import {MnemonicPhrase, Passphrase} from "../values";

export interface ScryptParams {
  N: number
  r: number
  p: number
  dkLen: number
  ivLen: number
  tagLen: number
  algorithm: string
}

export interface IEncryptionService {
  encrypt(passphrase: Passphrase, data: string): Promise<string>
  decrypt(passphrase: Passphrase, data: string): Promise<string>
  deriveSeed(mnemonic: MnemonicPhrase, passphrase?: Passphrase): Promise<string>
  decryptScrypt(data: string, salt: string, passphrase: Passphrase, scryptParams: ScryptParams): Promise<string>
}
