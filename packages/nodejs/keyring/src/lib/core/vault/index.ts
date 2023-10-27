import { v4, validate } from "uuid";
import { Account, SerializedAccount } from "./entities/Account";
import IEntity from "../common/IEntity";
import { AccountReference } from "../common/values";
import { AccountExistError } from "../../errors";

export * from "./entities/Account";

export interface SerializedVault extends IEntity {
  id: string;
  createdAt: number;
  updatedAt: number;
  accounts: SerializedAccount[];
}

export class Vault implements IEntity {
  private readonly _id: string;
  private readonly _createdAt: number;
  private readonly _updatedAt: number;
  private _accounts: Account[];

  constructor(
    id?: string,
    accounts?: Account[],
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

    this._id = id || v4();
    this._createdAt = originalCreationDate || Date.now();
    this._updatedAt = lastUpdatedAt || Date.now();
    this._accounts = accounts || [];
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

  serialize(): SerializedVault {
    return {
      id: this._id,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      accounts: this._accounts.map((account) => account.serialize()),
    };
  }

  static deserialize(serializedVault: SerializedVault): Vault {
    const accounts = serializedVault.accounts.map(Account.deserialize);
    return new Vault(
      serializedVault.id,
      accounts,
      serializedVault.createdAt,
      serializedVault.updatedAt
    );
  }

  addAccount(account: Account, replace = false) {
    const accountExists = this._accounts.some((a) => {
      return (
        a.address === account.address &&
        a.protocol === account.protocol
      );
    });

    if (accountExists && !replace) {
      throw new AccountExistError(account);
    }

    if (accountExists && replace) {
      this._accounts = this._accounts.filter((a) => {
        return (
          a.address !== account.address &&
          a.protocol === account.protocol
        );
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

  removeAccount(account: AccountReference) {
    this._accounts = this._accounts.filter((a) => a.id !== account.id);
  }
}
