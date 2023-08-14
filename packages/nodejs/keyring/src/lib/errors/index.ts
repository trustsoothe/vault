import {Account} from "../core/vault";

interface IKeyringError {
  name: string;
  message: string;
  innerError?: Error;
}

export class KeyringError extends Error {
  readonly keyringError: true = true;
  readonly name: string;
  readonly message: string;
  readonly innerError?: Error;

  constructor({ name, message, innerError }: IKeyringError) {
    super(message);

    this.name = name;
    this.message = message;
    this.innerError = innerError;
  }
}

export class SessionIdRequiredError extends KeyringError {
  constructor() {
    super({
      name: "SessionIdRequiredError",
      message: "Unauthorized: Session id is required",
    });
  }
}

export class SessionNotFoundError extends KeyringError {
  constructor() {
    super({
      name: "SessionNotFoundError",
      message: "Unauthorized: Session id not found",
    });
  }
}

export class InvalidSessionError extends KeyringError {
  constructor() {
    super({
      name: "InvalidSessionError",
      message: "Unauthorized: Session is invalid",
    });
  }
}

export class ForbiddenSessionError extends KeyringError {
  constructor() {
    super({
      name: "ForbiddenSessionError",
      message: "Unauthorized: Session is not allowed to perform this operation",
    });
  }
}

export class VaultIsLockedError extends KeyringError {
  constructor() {
    super({
      name: "VaultIsLockedError",
      message: "Invalid Operation: Vault is locked",
    });
  }
}

export class VaultRestoreError extends KeyringError {
  constructor() {
    super({
      name: "VaultRestoreError",
      message: "Invalid Operation: Vault can not be restored. Make sure the passphrase is correct.",
    });
  }
}

export class ProtocolNotSupported extends KeyringError {
  constructor(protocol?: string) {
    super({
      name: 'ProtocolNotSupported',
      message: protocol ? `Protocol "${protocol}" not supported` : 'Protocol not supported',
    });
  }
}

export class ArgumentError extends KeyringError {
  constructor(argument: string, message?: string) {
    super({
      name: 'ArgumentError',
      message: message || `Invalid Argument: ${argument}`,
    });
  }
}

export class NetworkRequestError extends KeyringError {
  constructor(message: string, innerError?: Error) {
    super({
      name: 'NetworkRequestError',
      message,
      innerError,
    });
  }
}

export class AccountExistError extends KeyringError {
  constructor(account: Account) {
    super({
      name: 'AccountExistError',
      message: `An account with address: ${account.address} and protocol: "${account.asset.protocol.name} | ${account.asset.protocol.chainID}" already exists within the vault.`,
    });
  }
}
