import { v4, validate } from "uuid";
import { Account, SerializedAccount } from "./entities/Account";
import IEntity from "../common/IEntity";
import { AccountReference } from "../common/values";
import {AccountExistError, RecoveryPhraseExistError} from "../../errors";
import { AccountType } from "./values/AccountType";
import {RecoveryPhrase, RecoveryPhraseReference, SerializedRecoveryPhrase} from "./entities/RecoveryPhrase";

export * from "./values/AccountReference";
export * from "./entities/Account";
export * from "./values/AccountType";

export interface SerializedVault extends IEntity {
  id: string;
  createdAt: number;
  updatedAt: number;
  accounts: SerializedAccount[];
  recoveryPhrases: SerializedRecoveryPhrase[];
}

export class Vault implements IEntity {
  private readonly _id: string;
  private readonly _createdAt: number;
  private readonly _updatedAt: number;
  private _accounts: Account[]
  private _recoveryPhrases: RecoveryPhrase[];

  constructor(
    id?: string,
    accounts?: Account[],
    recoveryPhrases?: RecoveryPhrase[],
    originalCreationDate?: number,
    lastUpdatedAt?: number
  ) {
    if (id && !validate(id)) {
      throw new Error("Invalid vault id: " + id);
    }

    if (accounts && Array.isArray(accounts) === false) {
      throw new Error(
        "Invalid argument: accounts. Expected an array of Account objects"
      );
    }

    if (recoveryPhrases && Array.isArray(recoveryPhrases) === false) {
      throw new Error(
        "Invalid argument: recoveryPhrases. Expected an array of RecoveryPhrase objects"
      );
    }

    this._id = id || v4();
    this._createdAt = originalCreationDate || Date.now();
    this._updatedAt = lastUpdatedAt || Date.now();
    this._accounts = accounts || [];
    this._recoveryPhrases = recoveryPhrases || [];
  }

  static FromVault(vault: Vault): Vault {
    return new Vault(v4(), vault.accounts.slice(), vault.recoveryPhrases.slice());
  }

  get id(): string {
    return this._id;
  }

  get createdAt(): number {
    return this._createdAt;
  }

  get updatedAt(): number {
    return this._updatedAt;
  }

  get accounts(): ReadonlyArray<Account> {
    return this._accounts;
  }

  get recoveryPhrases(): ReadonlyArray<RecoveryPhrase> {
      return this._recoveryPhrases;
  }

  serialize(): SerializedVault {
    return {
      id: this._id,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      accounts: this._accounts.map((account) => account.serialize()),
      recoveryPhrases: this._recoveryPhrases.map((recoveryPhrase) => recoveryPhrase.serialize())
    };
  }

  static deserialize(serializedVault: SerializedVault): Vault {
    const accounts = serializedVault.accounts.map(Account.deserialize);
    const recoveryPhrases = serializedVault.recoveryPhrases.map(RecoveryPhrase.deserialize);
    return new Vault(
      serializedVault.id,
      accounts,
      recoveryPhrases,
      serializedVault.createdAt,
      serializedVault.updatedAt
    );
  }

  addAccount(account: Account, replace = false) {
    const accountExists = this._accounts.some((a) => {
      const propertyToCompare =
        account.accountType === AccountType.HDSeed ? "privateKey" : "address";

      return (
        a[propertyToCompare] === account[propertyToCompare] &&
        a.protocol === account.protocol
      );
    });

    if (accountExists && !replace) {
      throw new AccountExistError(account);
    }

    if (accountExists && replace) {
      this._accounts = this._accounts.filter((a) => {
        return a.address !== account.address && a.protocol === account.protocol;
      });
    }

    this._accounts.push(account);
  }

  updateAccount(account: Account) {
    this._accounts = this._accounts.map((a) => {
      if (a.id === account.id) {
        return account;
      }

      return a;
    });
  }

  addRecoveryPhrase(recoveryPhrase: RecoveryPhrase) {
    const recoveryPhraseExists = this._recoveryPhrases.some((rp) => {
        return rp.phrase === recoveryPhrase.phrase
          && rp.passphrase === recoveryPhrase.passphrase;
    });

    if (recoveryPhraseExists) {
      throw new RecoveryPhraseExistError();
    }

    this._recoveryPhrases.push(recoveryPhrase);
  }

  updateRecoveryPhrase(recoveryPhrase: RecoveryPhrase) {
    this._recoveryPhrases = this._recoveryPhrases.map((rp) => {
      if (rp.id === recoveryPhrase.id) {
        return recoveryPhrase;
      }

      return rp;
    });
  }

  removeRecoveryPhrase(recoveryPhrase: RecoveryPhraseReference) {
    this._recoveryPhrases = this._recoveryPhrases.filter((rp) => rp.id !== recoveryPhrase.id);
  }

  removeAccount(account: AccountReference) {
    this._accounts = this._accounts.filter((a) => a.id !== account.id);
  }
}
