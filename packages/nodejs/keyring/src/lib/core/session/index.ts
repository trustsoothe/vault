import {v4, validate} from "uuid";
import {Permission} from "../common/permissions";
import {OriginReference, AccountReference, SerializedAccountReference} from "../common/values";
import IEntity from "../common/IEntity";
import {ForbiddenSessionError, InvalidSessionError} from "../../errors";

export interface SerializedSession extends IEntity {
  id: string
  permissions: Permission[]
  maxAge: number
  invalidated: boolean
  invalidatedAt: number
  origin: string
  createdAt: number
  lastActivity: number
}

export interface SessionOptions {
  permissions?: Permission[]
  maxAge?: number
  accounts?: AccountReference[]
  origin?: OriginReference
}

export class Session implements IEntity {
  private readonly _id: string
  private _permissions: Permission[]
  private readonly _maxAge: number
  private readonly _origin: OriginReference
  private _invalidated = false
  private _createdAt: number
  private _invalidatedAt?: number = null
  private _lastActivity: number = null

  constructor(options: SessionOptions = {}, id?: string) {
    if (id && validate(id) === false) {
      throw new Error('Invalid session id: ' + id)
    }

    if (options.permissions && Array.isArray(options.permissions) === false) {
      throw new Error('Invalid argument: permissions. Expected an array of Permission objects')
    }

    if (options.maxAge && options.maxAge < 0) {
      throw new Error('maxAge must be greater than or equal to 0')
    }

    this._id = id || v4()
    this._permissions = options.permissions
    this._maxAge = options.maxAge ?? 3600
    this._createdAt = Date.now()
    this._lastActivity = Date.now()
    this._origin = options.origin || null
  }

  get id(): string {
    return this._id
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

  get createdAt(): number {
    return this._createdAt
  }

  get invalidatedAt(): number {
    return this._invalidatedAt
  }

  get lastActivity(): number {
    return this._lastActivity
  }

  serialize(): SerializedSession {
    return {
      id: this._id,
      permissions: this._permissions,
      maxAge: this._maxAge,
      invalidated: this._invalidated,
      invalidatedAt: this._invalidatedAt,
      origin: (this._origin && this._origin.value) ?? '',
      createdAt: this._createdAt,
      lastActivity: this._lastActivity,
    }
  }

  isAllowed(resource: string, action: string, ids: string[] = ['*']): boolean {
    return this.permissions.some((permission) =>
      permission.resource === resource &&
      permission.action === action &&
        (permission.identities.includes('*') || ids.every((id) => permission.identities.includes(id)))
    )
  }

  invalidate(): void {
    if (this._invalidated) {
      return
    }

    this._invalidated = true
    this._invalidatedAt = Date.now()
  }

  isValid(): boolean {
    if (this._invalidated) {
      return false
    }

    if (this._maxAge === 0) {
      return true
    }

    return this.lastActivity + this.maxAge * 1000 > Date.now()
  }

  updateLastActivity(): void {
    if (!this.isValid()) {
      throw new InvalidSessionError()
    }

    this._lastActivity = Date.now()
  }

  addAccount(account: AccountReference): void {
    if (!this.isValid()) {
      throw new InvalidSessionError()
    }

    if (!this.isAllowed('account', 'create', [])) {
      throw new ForbiddenSessionError();
    }

    this._permissions = this.permissions.map((permission) => {
      if (permission.resource === 'account') {
        return {
          ...permission,
          identities: [...permission.identities, account.id]
        }
      }

      return permission
    });
  }

  static deserialize(serializedSession: SerializedSession): Session {
    const options: SessionOptions = {
      permissions: serializedSession.permissions,
      maxAge: serializedSession.maxAge,
      origin: (serializedSession.origin && new OriginReference(serializedSession.origin)) || null,
    }
    const session = new Session(options, serializedSession.id)
    session._createdAt = serializedSession.createdAt
    session._invalidated = serializedSession.invalidated
    session._invalidatedAt = serializedSession.invalidatedAt
    session._lastActivity = serializedSession.lastActivity
    return session
  }
}
