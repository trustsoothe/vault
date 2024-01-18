import {
  AccountReference,
  EncryptedVault,
  ExternalAccessRequest,
  Passphrase,
  SupportedProtocols,
  SupportedTransferDestinations,
  SupportedTransferOrigins,
} from "./core/common/values";
import IVaultStore from "./core/common/storage/IVaultStorage";
import { IEncryptionService } from "./core/common/encryption/IEncryptionService";
import { Account, AccountUpdateOptions, Vault } from "./core/vault";
import { SerializedSession, Session, SessionOptions } from "./core/session";
import { Permission, PermissionsBuilder } from "./core/common/permissions";
import IStorage from "./core/common/storage/IStorage";
import {
  AccountNotFoundError,
  ArgumentError,
  ForbiddenSessionError,
  InvalidSessionError,
  PrivateKeyRestoreError,
  SessionIdRequiredError,
  SessionNotFoundError,
  VaultIsLockedError,
  VaultRestoreError,
} from "./errors";
import {
  CreateAccountFromPrivateKeyOptions,
  CreateAccountOptions,
  EthereumNetworkProtocolService,
  PocketNetworkProtocolService,
  ProtocolServiceFactory,
} from "./core/common/protocols";
import { v4, validate } from "uuid";
import { Asset } from "./core/asset";
import { INetwork } from "./core/common/protocols/INetwork";
import { IProtocolTransactionResult } from "./core/common/protocols/ProtocolTransaction";
import { PocketNetworkTransactionTypes } from "./core/common/protocols/PocketNetwork/PocketNetworkTransactionTypes";
import { EthereumNetworkTransactionTypes } from "./core/common/protocols/EthereumNetwork/EthereumNetworkTransactionTypes";
import { IAsset } from "./core/common/protocols/IAsset";

export type AllowedProtocols = keyof typeof SupportedProtocols;

export interface TransferOptions {
  from: {
    type: SupportedTransferOrigins;
    passphrase?: string;
    asset?: Asset;
    value: string;
  };
  to: {
    type: SupportedTransferDestinations;
    value: string;
  };
  amount: number;
  network: INetwork;
  transactionParams: {
    from: string;
    to: string;
    amount: string;
    maxFeePerGas?: number;
    maxPriorityFeePerGas?: number;
    gasLimit?: number;
    data?: string;
    fee?: number;
    memo?: string;
  };
  asset?: IAsset;
}

export interface VaultOptions {
  sessionMaxAge?: number;
}

export class VaultTeller {
  private _isUnlocked = false;
  private _vault: Vault | null = null;

  constructor(
    private readonly vaultStore: IVaultStore,
    private readonly sessionStore: IStorage<SerializedSession>,
    private readonly encryptionService: IEncryptionService
  ) {}

  async unlockVault(passphrase: string, vaultOptions: VaultOptions = {}): Promise<Session> {
    const passphraseValue = new Passphrase(passphrase);
    const serializedEncryptedVault = await this.vaultStore.get();

    if (!serializedEncryptedVault) {
      throw new Error(
        "Vault could not be restored from store. Has it been initialized?"
      );
    }

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

    const sessionOptions: SessionOptions = { permissions };

    if (vaultOptions?.sessionMaxAge !== null && vaultOptions?.sessionMaxAge !== undefined) {
      sessionOptions.maxAge = vaultOptions?.sessionMaxAge;
    }

    const session = new Session(sessionOptions);
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

  async authorizeExternal(
    request: ExternalAccessRequest,
    protocol?: SupportedProtocols
  ): Promise<Session> {
    if (!request || !(request instanceof ExternalAccessRequest)) {
      throw new Error("ExternalAccessRequest object is required");
    }

    if (!this.isUnlocked) {
      throw new Error("Vault must be unlocked to authorize external access");
    }

    const newSessionId = v4();

    const permissions = request.addDefaultPermissions
      ? new PermissionsBuilder(request.permissions as Permission[])
          .forResource("session")
          .allow("revoke")
          .on(newSessionId)
          .build()
      : (request.permissions as Permission[]);

    // Concat will create a new array with the same elements as the original array (which is readonly).
    const sessionOptions: SessionOptions = {
      permissions,
      maxAge: request.maxAge,
      accounts: request.accounts.concat(),
      origin: request.origin || null,
      protocol,
    };

    const session = new Session(sessionOptions, newSessionId);
    await this.sessionStore.save(session.serialize());
    return session;
  }

  async listSessions(sessionId: string): Promise<ReadonlyArray<Session>> {
    await this.validateSessionForPermissions(sessionId, "session", "list");
    const serializedSessions = await this.sessionStore.list();
    await this.updateSessionLastActivity(sessionId);
    return serializedSessions.map(Session.deserialize);
  }

  async createAccount(
    sessionId: string,
    vaultPassphrase: Passphrase,
    options: CreateAccountOptions
  ): Promise<AccountReference> {
    await this.validateSessionForPermissions(sessionId, "account", "create");

    const protocolService = ProtocolServiceFactory.getProtocolService(
      options.protocol,
      this.encryptionService
    );

    if (!options.passphrase) {
      options.skipEncryption = true;
    }

    const account = await protocolService.createAccount(options);

    await this.addVaultAccount(account, vaultPassphrase);

    await this.addAccountToSession(sessionId, account);

    await this.updateSessionLastActivity(sessionId);

    return account.asAccountReference();
  }

  async createAccountFromPrivateKey(
    sessionId: string,
    vaultPassphrase: Passphrase,
    options: CreateAccountFromPrivateKeyOptions,
    replace = false
  ): Promise<AccountReference> {
    await this.validateSessionForPermissions(sessionId, "account", "create");

    const protocolService = ProtocolServiceFactory.getProtocolService(
      options.protocol,
      this.encryptionService
    );

    if (!options.passphrase) {
      options.skipEncryption = true;
    }

    const account = await protocolService.createAccountFromPrivateKey(options);

    const preExistingAccount = await this.getVaultAccountByReference(
      account.asAccountReference(),
      vaultPassphrase
    );

    await this.addVaultAccount(account, vaultPassphrase, replace);

    if (preExistingAccount && replace) {
      await this.removeAccountFromSession(
        sessionId,
        preExistingAccount.asAccountReference()
      );
    }

    await this.addAccountToSession(sessionId, account);

    await this.updateSessionLastActivity(sessionId);

    return account.asAccountReference();
  }

  async deriveAccountFromPrivateKey(
    options: CreateAccountFromPrivateKeyOptions
  ): Promise<Account> {
    const protocolService = ProtocolServiceFactory.getProtocolService(
      options.protocol,
      this.encryptionService
    );

    return await protocolService.createAccountFromPrivateKey({
      ...options,
      skipEncryption: true,
    });
  }

  async getAccountPrivateKey(
    sessionId: string,
    vaultPassphrase: Passphrase,
    accountReference: AccountReference,
    accountPassphrase?: Passphrase
  ): Promise<string> {
    await this.validateSessionForPermissions(sessionId, "account", "read", [
      accountReference.id,
    ]);

    if (!this.isUnlocked) {
      throw new VaultIsLockedError();``
    }

    const account = await this.getVaultAccountById(
      accountReference.id,
      vaultPassphrase
    );

    if (!account) {
      throw new AccountNotFoundError();
    }

    if (!account.isSecure) {
      return account.privateKey;
    }

    try {
      return await this.encryptionService.decrypt(
        accountPassphrase!,
        account.privateKey
      );
    } catch {
      throw new PrivateKeyRestoreError();
    }
  }

  async updateAccountName(
    sessionId: string,
    vaultPassphrase: Passphrase,
    options: AccountUpdateOptions
  ): Promise<AccountReference> {
    await this.validateSessionForPermissions(sessionId, "account", "update");

    const account = await this.getVaultAccountById(options.id, vaultPassphrase);

    account.updateName(options.name);

    await this.updateVaultAccount(account, vaultPassphrase);

    await this.updateSessionLastActivity(sessionId);

    return account.asAccountReference();
  }

  async listAccounts(sessionId: string) {
    if (!this.isUnlocked) {
      throw new VaultIsLockedError();
    }

    const session = await this.getSession(sessionId);

    if (!session) {
      throw new SessionNotFoundError();
    }

    if (!session.isValid()) {
      throw new InvalidSessionError();
    }

    const authorizedAccounts = this._vault?.accounts.filter((account) =>
      session.isAllowed("account", "read", [account.id])
    );

    await this.updateSessionLastActivity(sessionId);

    return authorizedAccounts?.map((a) => a.asAccountReference()) || [];
  }

  async removeAccount(
    sessionId: string,
    vaultPassphrase: Passphrase,
    accountReference: AccountReference
  ): Promise<void> {
    await this.validateSessionForPermissions(sessionId, "account", "delete");

    await this.removeVaultAccount(accountReference, vaultPassphrase);

    await this.removeAccountFromSession(sessionId, accountReference);

    await this.updateSessionLastActivity(sessionId);
  }

  async revokeSession(
    sessionId: string,
    revokeSessionId: string
  ): Promise<void> {
    await this.validateSessionForPermissions(sessionId, "session", "revoke", [
      revokeSessionId,
    ]);
    const session = await this.getSession(revokeSessionId);
    if (session) {
      session.invalidate();
      await this.sessionStore.save(session.serialize());
    }

    if (sessionId !== revokeSessionId) {
      await this.updateSessionLastActivity(sessionId);
    }
  }

  public async validateSessionForPermissions(
    sessionId: string,
    resource: string,
    action: string,
    ids: string[] = []
  ): Promise<void> {
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

  public async addAccountToSession(sessionId: string, account: Account) {
    const session = await this.getSession(sessionId);
    if (session) {
      session.addAccount(account.asAccountReference());
      await this.sessionStore.save(session.serialize());
    }
  }

  async transferFunds(
    sessionId: string,
    options: TransferOptions
  ): Promise<IProtocolTransactionResult<AllowedProtocols>> {
    await this.validateSessionForPermissions(sessionId, "transaction", "send");

    switch (options.from.type) {
      case SupportedTransferOrigins.RawPrivateKey:
        return await this.transferWithPrivateKey(options);
      case SupportedTransferOrigins.VaultAccountId:
        return await this.transferWithVaultAccount(options);
      default:
        throw new Error(`Transfer origin "${options.from.type}" not supported`);
    }
  }

  async sendRawTransaction(
    sessionId: string,
    options: TransferOptions
  ): Promise<IProtocolTransactionResult<AllowedProtocols>> {
    await this.validateSessionForPermissions(sessionId, "transaction", "send");

    let account: Account | null = null;
    let privateKey: string | null = null;

    if (options.from.type === SupportedTransferOrigins.RawPrivateKey) {
      account = await this.deriveAccountFromPrivateKey({
        protocol: options.network.protocol,
        privateKey: options.from.value,
        skipEncryption: true,
      });
      privateKey = options.from.value;
    }

    if (options.from.type === SupportedTransferOrigins.VaultAccountId) {
      const { account: vaultAccount, privateKey: vaultPrivateKey } =
        await this.getVaultAccountAndPrivateKey(options);
      account = vaultAccount;
      privateKey = vaultPrivateKey;
    }

    if (!account) {
      throw new Error(
        `Transfer origin "${options.from.type}" not supported. No account was found.`
      );
    }

    if (!privateKey) {
      throw new Error(
        `Transfer origin "${options.from.type}" not supported. No private key was found.`
      );
    }

    switch (options.network.protocol) {
      case SupportedProtocols.Pocket:
        // TODO: Needs to be updated once support for other transaction types is added in this protocol
        return await new PocketNetworkProtocolService(
          this.encryptionService
        ).sendTransaction(options.network, {
          protocol: SupportedProtocols.Pocket,
          transactionType: PocketNetworkTransactionTypes.Send,
          from: account.address,
          to: options.to.value,
          amount: options.amount.toString(),
          fee: options.transactionParams.fee,
          privateKey,
        });
      case SupportedProtocols.Ethereum:
        return await new EthereumNetworkProtocolService(
          this.encryptionService
        ).sendTransaction(
          options.network,
          {
            protocol: SupportedProtocols.Ethereum,
            transactionType: EthereumNetworkTransactionTypes.Raw,
            from: account.address,
            to: options.to.value,
            amount: options.amount.toString(),
            privateKey,
            maxPriorityFeePerGas:
              options.transactionParams.maxPriorityFeePerGas || 0,
            maxFeePerGas: options.transactionParams.maxFeePerGas || 0,
            gasLimit: options.transactionParams.gasLimit || 0,
            data: options.transactionParams.data,
          },
          options.asset
        );
      default:
        throw new Error(`Transfer origin "${options.from.type}" not supported`);
    }
  }

  private async sendTransaction(
    account: Account,
    privateKey: string,
    options: TransferOptions
  ) {
    switch (options.network.protocol) {
      case SupportedProtocols.Pocket:
        return await new PocketNetworkProtocolService(
          this.encryptionService
        ).sendTransaction(options.network, {
          protocol: SupportedProtocols.Pocket,
          transactionType: PocketNetworkTransactionTypes.Send,
          from: account.address,
          to: options.to.value,
          amount: options.amount.toString(),
          fee: options.transactionParams.fee,
          memo: options.transactionParams.memo,
          privateKey,
        });
      case SupportedProtocols.Ethereum:
        return await new EthereumNetworkProtocolService(
          this.encryptionService
        ).sendTransaction(
          options.network,
          {
            protocol: SupportedProtocols.Ethereum,
            transactionType: EthereumNetworkTransactionTypes.Transfer,
            from: account.address,
            to: options.to.value,
            amount: options.amount.toString(),
            privateKey,
            maxPriorityFeePerGas:
              options.transactionParams.maxPriorityFeePerGas || 0,
            maxFeePerGas: options.transactionParams.maxFeePerGas || 0,
            data: options.transactionParams.data,
          },
          options.asset
        );
      default:
        throw new Error(`Protocol ${options.network.protocol} not supported`);
    }
  }

  private async transferWithVaultAccount(
    options: TransferOptions
  ): Promise<IProtocolTransactionResult<AllowedProtocols>> {
    let { account, privateKey } = await this.getVaultAccountAndPrivateKey(
      options
    );
    return await this.sendTransaction(account, privateKey, options);
  }

  private async getVaultAccountAndPrivateKey(options: TransferOptions) {
    if (!this.isUnlocked) {
      throw new VaultIsLockedError();
    }

    if (!validate(options.from.value)) {
      throw new ArgumentError("from.value");
    }

    if (!options.from.passphrase) {
      throw new ArgumentError("from.passphrase");
    }

    const account = this._vault?.accounts.find(
      (account) => account.id === options.from.value
    );

    if (!account) {
      throw new AccountNotFoundError();
    }

    let privateKey: string;

    try {
      privateKey = await this.encryptionService.decrypt(
        new Passphrase(options.from.passphrase || ""),
        account.privateKey
      );
    } catch (e) {
      throw new PrivateKeyRestoreError();
    }
    return { account, privateKey };
  }

  private async transferWithPrivateKey(
    options: TransferOptions
  ): Promise<IProtocolTransactionResult<AllowedProtocols>> {
    const account = await this.deriveAccountFromPrivateKey({
      protocol: options.network.protocol,
      privateKey: options.from.value,
      skipEncryption: true,
    });

    return await this.sendTransaction(account, options.from.value, options);
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
      throw new VaultRestoreError();
    }

    try {
      return Vault.deserialize(JSON.parse(vaultJson));
    } catch (error) {
      throw new Error(
        "Unable to deserialize vault. Has it been tempered with?"
      );
    }
  }

  public async getSession(sessionId: string): Promise<Session | null> {
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

  private async addVaultAccount(
    account: Account,
    vaultPassphrase: Passphrase,
    replace = false
  ) {
    const vault = await this.getVault(vaultPassphrase);

    vault.addAccount(account, replace);

    const encryptedUpdatedVault = await this.encryptVault(
      vaultPassphrase,
      vault
    );

    await this.vaultStore.save(encryptedUpdatedVault.serialize());

    /**
     * Once the persisted vault is updated, we can perform our in-memory update
     */
    this._vault?.addAccount(account, replace);
  }

  private async getVaultAccountById(
    accountId: string,
    vaultPassphrase: Passphrase
  ): Promise<Account> {
    const vault = await this.getVault(vaultPassphrase);

    const account = vault.accounts.find((account) => account.id === accountId);

    if (!account) {
      throw new AccountNotFoundError();
    }

    return account;
  }

  private async getVaultAccountByReference(
    accountReference: AccountReference,
    vaultPassphrase: Passphrase
  ): Promise<Account | undefined> {
    const vault = await this.getVault(vaultPassphrase);
    return vault.accounts.find((a) => {
      return (
        a.address === accountReference.address &&
        a.protocol === accountReference.protocol
      );
    });
  }

  private async updateVaultAccount(
    account: Account,
    vaultPassphrase: Passphrase
  ) {
    const vault = await this.getVault(vaultPassphrase);

    vault.updateAccount(account);

    const encryptedUpdatedVault = await this.encryptVault(
      vaultPassphrase,
      vault
    );

    await this.vaultStore.save(encryptedUpdatedVault.serialize());
  }

  private async getVault(vaultPassphrase: Passphrase) {
    const serializedEncryptedVault = await this.vaultStore.get();

    if (!serializedEncryptedVault) {
      throw new Error("Vault is not initialized");
    }

    const encryptedOriginalVault = EncryptedVault.deserialize(
      serializedEncryptedVault
    );

    if (!encryptedOriginalVault) {
      throw new Error("Vault is not initialized");
    }

    return await this.decryptVault(vaultPassphrase, encryptedOriginalVault);
  }

  private async removeVaultAccount(
    accountReference: AccountReference,
    vaultPassphrase: Passphrase
  ) {
    const vault = await this.getVault(vaultPassphrase);

    vault.removeAccount(accountReference);

    const encryptedUpdatedVault = await this.encryptVault(
      vaultPassphrase,
      vault
    );

    await this.vaultStore.save(encryptedUpdatedVault.serialize());

    /**
     * Once the persisted vault is updated, we can perform our in-memory update
     */
    this._vault?.removeAccount(accountReference);
  }

  private async removeAccountFromSession(
    sessionId: string,
    accountReference: AccountReference
  ) {
    const session = await this.getSession(sessionId);
    if (session) {
      session.removeAccount(accountReference);
      await this.sessionStore.save(session.serialize());
    }
  }
}
