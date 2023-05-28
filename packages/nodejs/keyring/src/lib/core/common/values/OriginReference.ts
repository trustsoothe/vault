export class OriginReference {
  private readonly _value: string = ''
  constructor(uri: string) {
    this._value = uri
  }

  get value(): string {
    return this._value
  }
}
