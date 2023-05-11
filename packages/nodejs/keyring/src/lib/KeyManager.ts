import { Passphrase, EncryptedVault } from "./core/common/values";
import IVaultStore from "./core/common/storage/IVaultStorage";
import ISessionStore from "./core/common/storage/ISessionStorage";
import IEncryptionService from "./core/common/encryption/IEncryptionService";
import {Vault} from "./core/vault";

export class KeyManager {
  private _isUnlocked = false
  private _vault: Vault | null = null

  constructor(private readonly vaultStore: IVaultStore,
              private readonly sessionStore: ISessionStore,
              private readonly encryptionService: IEncryptionService) {
  }

  async unlockVault(passphrase: string): Promise<void> {
    const passphraseValue = new Passphrase(passphrase)
    const encryptedVault = await this.vaultStore.get()

    if (!encryptedVault) {
      throw new Error('Vault could not be restored from store. Has it been initialized?')
    }

    let vaultJson: string

    try {
      vaultJson = await this.encryptionService.decrypt(passphraseValue, encryptedVault.contents)
    } catch (error) {
      throw new Error('Unable to restore vault. Is passphrase incorrect?')
    }

    try {
      this._vault = Vault.fromSerialized(JSON.parse(vaultJson))
      this._isUnlocked = true
    } catch (error) {
      throw new Error('Unable to deserialize vault. Has it been tempered with?')
    }
  }

  lockVault(): void {
    this._isUnlocked = false
    this._vault = null
  }

  async initializeVault(passphrase: string): Promise<void> {
    const passphraseValue = new Passphrase(passphrase)
    const vault = await this.vaultStore.get()

    if (vault) {
      throw new Error('Vault is already initialized')
    }

    const newVault = new Vault();
    const encryptedVault = await this.encryptVault(passphraseValue, newVault)
    await this.vaultStore.save(encryptedVault.serialize())
  }

  get isUnlocked(): boolean {
    return this._isUnlocked && this._vault !== null
  }

  private async encryptVault(passphrase: Passphrase, vault: Vault): Promise<EncryptedVault> {
    const vaultJson = JSON.stringify(vault.serialize())
    const encryptedVaultJson = await this.encryptionService.encrypt(passphrase, vaultJson)
    return new EncryptedVault(encryptedVaultJson, vault.createdAt, vault.updatedAt);
  }
}
