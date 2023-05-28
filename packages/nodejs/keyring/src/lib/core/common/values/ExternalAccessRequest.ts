import {Permission} from "../permissions";
import {OriginReference} from "./OriginReference";
import {AccountReference} from "./AccountReference";

export class ExternalAccessRequest {
  private readonly _permissions: Permission[]
  private readonly _maxAge: number
  private readonly _origin: OriginReference
  private readonly _accounts: AccountReference[]

  constructor(permissions: Permission[], maxAge: number, origin: OriginReference, accounts: AccountReference[] = []) {
    this._permissions = permissions
    this._maxAge = maxAge
    this._origin = origin
    this._accounts = accounts
  }

  get permissions(): ReadonlyArray<Permission> {
    return this._permissions.map((p) => Object.freeze({...p}));
  }

  get maxAge(): number {
    return this._maxAge
  }

  get origin(): OriginReference {
    return this._origin
  }

  get accounts(): ReadonlyArray<AccountReference> {
    return this._accounts
  }
}
