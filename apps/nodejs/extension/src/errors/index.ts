export class BaseError extends Error {
  public readonly name: string;
  public readonly code: number;
  public readonly message: string;

  constructor(message: string) {
    super(message);
    this.message = message;
  }
}
