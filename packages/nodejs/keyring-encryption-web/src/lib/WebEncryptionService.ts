import {IEncryptionService, MnemonicPhrase, Passphrase, ScryptParams} from "@poktscan/keyring";
import {scrypt} from '@noble/hashes/scrypt';

const DERIVED_KEY_FORMAT = 'AES-GCM';
const STRING_ENCODING = 'utf-8';
const SEED_ALG = 'PBKDF2';
const SEED_HASH_FN = 'SHA-512';
const SEED_HASH_ROUNDS = 2048;
const PBKDF2_KEY_LENGTH_IN_BITS = 512;

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

    async deriveSeed(mnemonic: MnemonicPhrase, passphrase?: Passphrase): Promise<string> {
        if (!mnemonic) {
            throw new Error('Invalid Operation: Mnemonic phrase not provided')
        }

        if (!mnemonic.isValid()) {
            throw new Error('Invalid Operation: Mnemonic phrase is not valid')
        }

        const passphraseValue = this.normalizeString((passphrase && passphrase.get()) || '');
        const mnemonicLiteral = this.normalizeString(mnemonic.words.map(w => w.word).join(' '));
        const salt = "mnemonic" + passphraseValue;

        const encoder = new TextEncoder();
        const mnemonicData = encoder.encode(mnemonicLiteral);
        const saltData = encoder.encode(salt);

        const importedKey = await crypto.subtle.importKey(
          'raw',
          mnemonicData,
          { name: SEED_ALG },
          false,
          ['deriveBits']
        );

        const derivedKey = await crypto.subtle.deriveBits(
          {
              name: SEED_ALG,
              salt: saltData,
              iterations: SEED_HASH_ROUNDS,
              hash: SEED_HASH_FN,
          },
          importedKey,
          PBKDF2_KEY_LENGTH_IN_BITS
        );

        const derivedKeyArray = Array.from(new Uint8Array(derivedKey));

        return derivedKeyArray
          .map(byte => byte.toString(16).padStart(2, '0'))
          .join('');
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

    private normalizeString(str: string): string {
        return str.normalize('NFKD');
    }
}
