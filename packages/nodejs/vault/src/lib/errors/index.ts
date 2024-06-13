import { Account } from "../core/vault";

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

export const SessionNotFoundErrorName = "SessionNotFoundError";

export class SessionNotFoundError extends KeyringError {
  constructor() {
    super({
      name: SessionNotFoundErrorName,
      message: "Unauthorized: Session id not found",
    });
  }
}

export const InvalidSessionErrorName = "InvalidSessionError";

export class InvalidSessionError extends KeyringError {
  constructor() {
    super({
      name: InvalidSessionErrorName,
      message: "Unauthorized: Session is invalid",
    });
  }
}

export const ForbiddenSessionErrorName = "ForbiddenSessionError";

export class ForbiddenSessionError extends KeyringError {
  constructor() {
    super({
      name: ForbiddenSessionErrorName,
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

export const VaultRestoreErrorName = "VaultRestoreError";

export class VaultRestoreError extends KeyringError {
  constructor() {
    super({
      name: VaultRestoreErrorName,
      message:
        "Invalid Operation: Vault can not be restored. Make sure the passphrase is correct.",
    });
  }
}

export const VaultUninitializedErrorName = 'VaultUninitializedError'

export class VaultUninitializedError extends KeyringError {
  constructor() {
    super({
      name: VaultUninitializedErrorName,
      message: 'Vault could not be restored from store. Has it been initialized?',
    });
  }
}

export class ProtocolNotSupported extends KeyringError {
  constructor(protocol?: string) {
    super({
      name: "ProtocolNotSupported",
      message: protocol
        ? `Protocol "${protocol}" not supported`
        : "Protocol not supported",
    });
  }
}

export class ArgumentError extends KeyringError {
  constructor(argument: string, message?: string) {
    super({
      name: "ArgumentError",
      message: message || `Invalid Argument: ${argument}`,
    });
  }
}

export class NetworkRequestError extends KeyringError {
  constructor(message: string, innerError?: Error) {
    super({
      name: "NetworkRequestError",
      message,
      innerError,
    });
  }
}

export const AccountExistErrorName = "AccountExistError";

export class AccountExistError extends KeyringError {
  constructor(account: Account) {
    super({
      name: AccountExistErrorName,
      message: `An account with address: ${account.address} and protocol: "${account.protocol}" already exists within the vault.`,
    });
  }
}

export const RecoveryPhraseExistErrorName = "RecoveryPhraseExistError";

export class RecoveryPhraseExistError extends KeyringError {
  constructor() {
    super({
      name: RecoveryPhraseExistErrorName,
      message: `A recovery phrase with the same combination of words and passphrase already exists within the vault.`,
    });
  }
}

export class ProtocolMismatchError extends KeyringError {
  constructor(message?: string) {
    super({
      name: "ProtocolMismatchError",
      message: message || `Mismatching protocols have been provided`,
    });
  }
}

export class InvalidPrivateKeyError extends KeyringError {
  constructor(message?: string) {
    super({
      name: "InvalidPrivateKeyError",
      message: message || "The provided private key is invalid",
    });
  }
}

export class AccountNotFoundError extends KeyringError {
  constructor(message?: string) {
    super({
      name: "AccountNotFoundError",
      message: message || "The provided account was not found",
    });
  }
}

export class RecoveryPhraseNotFoundError extends KeyringError {
  constructor(message?: string) {
    super({
      name: "RecoveryPhraseNotFoundError",
      message: message || "The requested recovery phrase was not found",
    });
  }
}

export class ProtocolTransactionError extends KeyringError {
  constructor(message?: string, innerError?: Error) {
    super({
      name: "ProtocolTransactionError",
      message: message || "The provided transaction failed",
      innerError,
    });
  }
}

export const PrivateKeyRestoreErrorName = "PrivateKeyRestoreError";

export class PrivateKeyRestoreError extends KeyringError {
  constructor(message?: string) {
    super({
      name: PrivateKeyRestoreErrorName,
      message:
        message ||
        "Invalid Operation: Private Key can not be restored. Make sure the passphrase is correct.",
    });
  }
}

export class InvalidChainIDError extends KeyringError {
  constructor(message?: string) {
    super({
      name: "InvalidChainIDError",
      message: message || "Invalid Chain ID",
    });
  }
}

export class RecoveryPhraseError extends KeyringError {
  constructor(message?: string) {
    super({
      name: "RecoveryPhraseError",
      message: message || "Invalid",
    });
  }
}
