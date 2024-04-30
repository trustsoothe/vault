import {IEncryptionService, Passphrase} from "@poktscan/vault";

const DERIVED_KEY_FORMAT = 'AES-GCM';
const STRING_ENCODING = 'utf-8';

export class WebEncryptionService implements IEncryptionService {
    async decrypt(passphrase: Passphrase, data: string): Promise<string> {
        const { salt, ...payload } = JSON.parse(data)
        const passBuffer = Buffer.from(passphrase.get(), STRING_ENCODING)
        const saltBuffer = Buffer.from(salt, 'base64')
        const key = await this.deriveKeyFromPassphrase(passBuffer, saltBuffer)
        const encryptedData = Buffer.from(payload.data, 'base64');
        const vector = Buffer.from(payload.iv, 'base64');
        try {
            const result = await crypto.subtle.decrypt(
              { name: DERIVED_KEY_FORMAT, iv: vector },
              key,
              encryptedData,
            );

            const decryptedData = new Uint8Array(result);
            return Buffer.from(decryptedData).toString(STRING_ENCODING);
        } catch (e) {
            throw new Error('Incorrect password');
        }
    }

    async encrypt(passphrase: Passphrase, data: string): Promise<string> {
        const salt = this.generateSalt()

        const passBuffer = Buffer.from(passphrase.get(), STRING_ENCODING)
        const saltBuffer = Buffer.from(salt, 'base64')

        const derivedKey = await this.deriveKeyFromPassphrase(passBuffer, saltBuffer)

        const dataBuffer = Buffer.from(data, STRING_ENCODING);
        const vector = globalThis.crypto.getRandomValues(new Uint8Array(16))

        const buf = await globalThis.crypto.subtle.encrypt(
          {
              name: DERIVED_KEY_FORMAT,
              iv: vector,
          },
          derivedKey,
          dataBuffer,
        );

        const buffer = new Uint8Array(buf);
        const vectorStr = Buffer.from(vector).toString('base64');
        const vaultStr = Buffer.from(buffer).toString('base64');

        return JSON.stringify({
            data: vaultStr,
            iv: vectorStr,
            salt,
        });
    }

    private generateSalt(byteCount = 32): string {
        const view = new Uint8Array(byteCount);
        globalThis.crypto.getRandomValues(view);
        return Buffer.from(view).toString('base64');
    }

    private async deriveKeyFromPassphrase(passBuffer: Buffer, saltBuffer: Buffer): Promise<CryptoKey> {
        const key = await globalThis.crypto.subtle.importKey(
          'raw',
          passBuffer,
          { name: 'PBKDF2' },
          false,
          ['deriveBits', 'deriveKey'],
        )

        return await globalThis.crypto.subtle.deriveKey(
          {
              name: 'PBKDF2',
              salt: saltBuffer,
              iterations: 10000,
              hash: 'SHA-256',
          },
          key,
          { name: DERIVED_KEY_FORMAT, length: 256 },
          false,
          ['encrypt', 'decrypt'],
        )
    }
}
