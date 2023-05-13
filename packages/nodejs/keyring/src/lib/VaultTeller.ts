import { Passphrase, EncryptedVault } from "./core/common/values";
import IVaultStore from "./core/common/storage/IVaultStorage";
import ISessionStore from "./core/common/storage/ISessionStorage";
import IEncryptionService from "./core/common/encryption/IEncryptionService";
import {Vault} from "./core/vault";
import {Session} from "./core/session";
import {PermissionsBuilder} from "./core/common/permissions";

export class VaultTeller {
  private _isUnlocked = false
  private _vault: Vault | null = null

  constructor(private readonly vaultStore: IVaultStore,
              private readonly sessionStore: ISessionStore,
              private readonly encryptionService: IEncryptionService) {
  }

  async unlockVault(passphrase: string): Promise<Session> {
    const passphraseValue = new Passphrase(passphrase)
    const serializedEncryptedVault = await this.vaultStore.get()
    const encryptedVault = EncryptedVault.deserialize(serializedEncryptedVault)

    if (!encryptedVault) {
      throw new Error('Vault could not be restored from store. Has it been initialized?')
    }

    const vault = await this.decryptVault(passphraseValue, encryptedVault)

    const permissions =
      new PermissionsBuilder()
        .forResource('account')
          .allowEverything()
          .onAny()
        .build();

    const session = new Session(permissions)
    await this.sessionStore.save(session.serialize())

    this._vault = vault
    this._isUnlocked = true
    return session
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

  private async decryptVault(passphrase: Passphrase, encryptedVault: EncryptedVault): Promise<Vault> {
    let vaultJson: string

    try {
      vaultJson = await this.encryptionService.decrypt(passphrase, encryptedVault.contents)
    } catch (error) {
      throw new Error('Unable to restore vault. Is passphrase incorrect?')
    }

    try {
      return Vault.deserialize(JSON.parse(vaultJson))
    } catch (error) {
      throw new Error('Unable to deserialize vault. Has it been tempered with?')
    }
  }
}
