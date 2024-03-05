
export interface SerializedEncryptedVault {
  contents: string
  createdAt: number
  updatedAt: number
}

export class EncryptedVault {
  constructor(
    private readonly _contents: string,
    private readonly _createdAt: number,
    private readonly _updatedAt: number,
  ) {
  }

  get createdAt(): number {
    return this._createdAt
  }

  get updatedAt(): number {
    return this._updatedAt
  }

  get contents(): string {
    return this._contents
  }

  serialize(): SerializedEncryptedVault {
    return {
      contents: this._contents,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    }
  }

  static deserialize(serializedEncryptedVault: SerializedEncryptedVault): EncryptedVault | null {
    if (!serializedEncryptedVault) {
      return null
    }

    return new EncryptedVault(serializedEncryptedVault.contents, serializedEncryptedVault.createdAt, serializedEncryptedVault.updatedAt)
  }
}
