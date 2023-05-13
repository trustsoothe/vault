import {v4, validate} from "uuid";
import {Permission} from "../common/permissions";

export interface SerializedSession {
  id: string
  permissions: Permission[]
  maxAge: number
  createdAt: number
}

export class Session {
  private readonly _id: string
  private readonly _permissions: Permission[]
  private readonly _maxAge: number
  private _createdAt: number

  constructor(permissions?: Permission[], maxAge?: number, id?: string) {
    if (id && validate(id) === false) {
      throw new Error('Invalid session id: ' + id)
    }

    if (permissions && Array.isArray(permissions) === false) {
      throw new Error('Invalid argument: permissions. Expected an array of Permission objects')
    }

    if (maxAge && maxAge < 0) {
      throw new Error('maxAge must be greater than or equal to 0')
    }

    this._id = id || v4()
    this._permissions = permissions
    this._maxAge = maxAge ?? 3600
    this._createdAt = Date.now()
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

  isValid(): boolean {
    if (this._maxAge === 0) {
      return true
    }

    return this._createdAt + this._maxAge * 1000 > Date.now()
  }

  serialize(): SerializedSession {
    return {
      id: this._id,
      permissions: this._permissions,
      maxAge: this._maxAge,
      createdAt: this._createdAt,
    }
  }

  static deserialize(serializedSession: SerializedSession): Session {
    const session = new Session(serializedSession.permissions, serializedSession.maxAge, serializedSession.id)
    session._createdAt = serializedSession.createdAt
    return session
  }
}
