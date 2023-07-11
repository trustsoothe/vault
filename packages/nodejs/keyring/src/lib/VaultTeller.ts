import {
  Passphrase,
  EncryptedVault,
  ExternalAccessRequest,
} from "./core/common/values";
import IVaultStore from "./core/common/storage/IVaultStorage";
import IEncryptionService from "./core/common/encryption/IEncryptionService";
import {Account, Vault} from "./core/vault";
import { SerializedSession, Session, SessionOptions } from "./core/session";
import { PermissionsBuilder } from "./core/common/permissions";
import IStorage from "./core/common/storage/IStorage";
import {
  ForbiddenSessionError,
  InvalidSessionError,
  SessionIdRequiredError,
  SessionNotFoundError,
  VaultIsLockedError,
} from "./errors";
import {Asset} from "./core/asset";
import {ProtocolServiceFactory} from "./core/common/protocols";

export class VaultTeller {
  private _isUnlocked = false;
  private _vault: Vault | null = null;

  constructor(
    private readonly vaultStore: IVaultStore,
    private readonly sessionStore: IStorage<SerializedSession>,
    private readonly encryptionService: IEncryptionService
  ) {}

  async unlockVault(passphrase: string): Promise<Session> {
    const passphraseValue = new Passphrase(passphrase);
    const serializedEncryptedVault = await this.vaultStore.get();
    const encryptedVault = EncryptedVault.deserialize(serializedEncryptedVault);

    if (!encryptedVault) {
      throw new Error(
        "Vault could not be restored from store. Has it been initialized?"
      );
    }

    const vault = await this.decryptVault(passphraseValue, encryptedVault);

    const permissions = new PermissionsBuilder()
      .forResource("account")
      .allowEverything()
      .onAny()
      .forResource("transaction")
      .allowEverything()
      .onAny()
      .forResource("session")
      .allowEverything()
      .onAny()
      .build();

    const session = new Session({ permissions, maxAge: 0 });
    await this.sessionStore.save(session.serialize());

    this._vault = vault;
    this._isUnlocked = true;
    return session;
  }

  lockVault(): void {
    this._isUnlocked = false;
    this._vault = null;
  }

  async initializeVault(passphrase: string): Promise<void> {
    const passphraseValue = new Passphrase(passphrase);
    const vault = await this.vaultStore.get();

    if (vault) {
      throw new Error("Vault is already initialized");
    }

    const newVault = new Vault();
    const encryptedVault = await this.encryptVault(passphraseValue, newVault);
    await this.vaultStore.save(encryptedVault.serialize());
  }

  async isSessionValid(sessionId: string): Promise<boolean> {
    const session = await this.getSession(sessionId);
    if (session) {
      return session.isValid();
    }
    return false;
  }

  async authorizeExternal(request: ExternalAccessRequest): Promise<Session> {
    if (!request || !(request instanceof ExternalAccessRequest)) {
      throw new Error("ExternalAccessRequest object is required");
    }

    if (!this.isUnlocked) {
      throw new Error("Vault must be unlocked to authorize external access");
    }

    // Concat will create a new array with the same elements as the original array (which is readonly).
    const sessionOptions: SessionOptions = {
      permissions: request.permissions.concat(),
      maxAge: request.maxAge,
      accounts: request.accounts.concat(),
      origin: request.origin || null,
    };

    const session = new Session(sessionOptions);
    await this.sessionStore.save(session.serialize());
    return session;
  }

  async listSessions(sessionId: string): Promise<ReadonlyArray<Session>> {
    await this.validateSessionForPermissions(sessionId, "session", "list");
    const serializedSessions = await this.sessionStore.list();
    await this.updateSessionLastActivity(sessionId);
    return serializedSessions.map(Session.deserialize);
  }

  async createAccount(sessionId: string, asset: Asset, accountPassphrase: Passphrase, vaultPassphrase: Passphrase): Promise<void> {
    await this.validateSessionForPermissions(sessionId, "account", "create");

    const protocolService=
      ProtocolServiceFactory.getProtocolService(asset.protocol, this.encryptionService);

    const account = await protocolService.createAccount({
      asset,
      passphrase: accountPassphrase,
    });

    await this.addVaultAccount(account, vaultPassphrase);

    await this.updateSessionLastActivity(sessionId);
  }

  async listAccounts(sessionId: string) {
    await this.validateSessionForPermissions(sessionId, "account", "list");
    await this.updateSessionLastActivity(sessionId);
    const session = await this.getSession(sessionId);
    if (session) {
      return session.accounts;
    }
  }

  async revokeSession(
    sessionId: string,
    revokeSessionId: string
  ): Promise<void> {
    await this.validateSessionForPermissions(sessionId, "session", "revoke");
    const session = await this.getSession(revokeSessionId);
    if (session) {
      session.invalidate();
      await this.sessionStore.save(session.serialize());
    }
    await this.updateSessionLastActivity(sessionId);
  }

  public async validateSessionForPermissions(
    sessionId: string,
    resource: string,
    action: string,
    ids: string[] = []
  ): Promise<void> {
    if (!this.isUnlocked) {
      throw new VaultIsLockedError();
    }

    if (!sessionId) {
      throw new SessionIdRequiredError();
    }

    const session = await this.getSession(sessionId);

    if (!session) {
      throw new SessionNotFoundError();
    }

    if (!session.isValid()) {
      throw new InvalidSessionError();
    }

    const isAllowed = session.isAllowed(resource, action, ids);

    if (!isAllowed) {
      throw new ForbiddenSessionError();
    }
  }

  get isUnlocked(): boolean {
    return this._isUnlocked && this._vault !== null;
  }

  private async encryptVault(
    passphrase: Passphrase,
    vault: Vault
  ): Promise<EncryptedVault> {
    const vaultJson = JSON.stringify(vault.serialize());
    const encryptedVaultJson = await this.encryptionService.encrypt(
      passphrase,
      vaultJson
    );
    return new EncryptedVault(
      encryptedVaultJson,
      vault.createdAt,
      vault.updatedAt
    );
  }

  private async decryptVault(
    passphrase: Passphrase,
    encryptedVault: EncryptedVault
  ): Promise<Vault> {
    let vaultJson: string;

    try {
      vaultJson = await this.encryptionService.decrypt(
        passphrase,
        encryptedVault.contents
      );
    } catch (error) {
      throw new Error("Unable to restore vault. Is passphrase incorrect?");
    }

    try {
      return Vault.deserialize(JSON.parse(vaultJson));
    } catch (error) {
      throw new Error(
        "Unable to deserialize vault. Has it been tempered with?"
      );
    }
  }

  private async getSession(sessionId: string): Promise<Session | null> {
    const serializedSession = await this.sessionStore.getById(sessionId);
    if (serializedSession) {
      return Session.deserialize(serializedSession);
    }
    return null;
  }

  private async updateSessionLastActivity(sessionId: string): Promise<void> {
    const session = await this.getSession(sessionId);
    if (session) {
      session.updateLastActivity();
      await this.sessionStore.save(session.serialize());
    }
  }

  private async addVaultAccount(account: Account, vaultPassphrase: Passphrase) {
    const serializedEncryptedVault = await this.vaultStore.get();

    if (!serializedEncryptedVault) {
      throw new Error("Vault is not initialized");
    }

    const encryptedOriginalVault = EncryptedVault.deserialize(serializedEncryptedVault);

    const vault = await this.decryptVault(vaultPassphrase, encryptedOriginalVault);

    vault.addAccount(account);

    const encryptedUpdatedVault = await this.encryptVault(vaultPassphrase, vault);

    await this.vaultStore.save(encryptedUpdatedVault.serialize());
  }
}
