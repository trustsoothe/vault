import { webcrypto } from 'node:crypto';

/**
 * This workaround is required by the '@noble/ed25519' library. See: https://github.com/paulmillr/noble-ed25519#usage
 * node.js 18 and earlier,  needs globalThis.crypto polyfill
 */
if (!globalThis.crypto) {
  // @ts-ignore
  globalThis.crypto = webcrypto;
}

import {CreateAccountOptions, IProtocolService} from '../IProtocolService';
import {Account} from "../../../vault";
import {fromUint8Array} from 'hex-lite';
import {utils,  getPublicKeyAsync} from '@noble/ed25519';
import {Buffer} from "buffer";
import IEncryptionService from "../../encryption/IEncryptionService";


export class PocketNetworkProtocolService implements IProtocolService {
  constructor(private IEncryptionService: IEncryptionService) {}
  async createAccount(options: CreateAccountOptions): Promise<Account> {
    if (!options.asset) {
       throw new Error('Invalid Operation: Asset instance not provided')
    }

    if (!options.passphrase) {
        throw new Error('Invalid Operation: Passphrase instance not provided')
    }

    const shortPrivateKey = utils.randomPrivateKey()
    const publicKey = await getPublicKeyAsync(shortPrivateKey)
    const address = await this.getAddressFromPublicKey(Buffer.from(publicKey).toString('hex'))
    const privateKey = `${Buffer.from(shortPrivateKey).toString('hex')}${Buffer.from(publicKey).toString('hex')}`
    const encryptedPrivateKey = await this.IEncryptionService.encrypt(options.passphrase, privateKey)

    return new Account({
      asset: options.asset,
      address,
      publicKey: Buffer.from(publicKey).toString('hex'),
      privateKey: encryptedPrivateKey,
    })
  }

  private async getAddressFromPublicKey(
    publicKey: string
  ): Promise<string> {
    const hash = await globalThis.crypto.subtle.digest(
      {
        name: 'SHA-256',
      },
      this.hexStringToByteArray(publicKey)
    )

    return fromUint8Array(new Uint8Array(hash)).slice(0, 40)
  }

  private  hexStringToByteArray(str: string): Uint8Array {
    return Uint8Array.from(str.match(/.{1,2}/g).map((byte) => parseInt(byte, 16)))
  }
}
