export class Passphrase {
  private readonly value: string
  constructor(value: string) {
    if (!value) {
      throw new Error('Passphrase cannot be null or empty')
    }
    this.value = value
  }

  get(): string {
    return this.value
  }
}
