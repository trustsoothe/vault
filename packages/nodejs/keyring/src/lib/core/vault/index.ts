import {v4, validate} from 'uuid'
import {Account, SerializedAccount} from "./entities/Account"

export interface SerializedVault {
  id: string
  createdAt: number
  updatedAt: number
  accounts: SerializedAccount[]
}

export class Vault {
  private readonly _id: string
  private readonly _createdAt: number
  private readonly _updatedAt: number
  private readonly _accounts: Account[]

  constructor(id?: string, accounts?: Account[], originalCreationDate?: number,  lastUpdatedAt?: number) {
    if (id && validate(id) === false) {
      throw new Error('Invalid vault id: ' + id)
    }

    if (accounts && Array.isArray(accounts) === false) {
      throw new Error('Invalid argument: accounts. Expected an array of Account objects')
    }

    this._id = id || v4()
    this._createdAt = originalCreationDate || Date.now()
    this._updatedAt = lastUpdatedAt || Date.now()
    this._accounts = accounts || []
  }

  static fromSerialized(serializedVault: SerializedVault): Vault {
    const accounts = serializedVault.accounts.map(Account.fromSerialized)
    return new Vault(serializedVault.id, accounts, serializedVault.createdAt, serializedVault.updatedAt)
  }

  get id(): string {
    return this._id
  }

  get createdAt(): number {
    return this._createdAt
  }

  get updatedAt(): number {
    return this._updatedAt
  }

  get accounts(): ReadonlyArray<Account> {
    return this._accounts;
  }

  serialize(): SerializedVault {
    return {
      id: this._id,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      accounts: this._accounts.map((account) => account.serialize())
    }
  }
}
