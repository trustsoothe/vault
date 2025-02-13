import {
  SerializedAccountReference,
  UpdateRecoveryPhraseRequest,
} from "@soothe/vault";
import type { ImportAccountParam } from "../../redux/slices/vault/account";
import type { BaseData, BaseResponse, UnknownErrorType } from "./common";
import {
  CHECK_PERMISSION_FOR_SESSION_REQUEST,
  CHECK_PERMISSION_FOR_SESSION_RESPONSE,
  EXPORT_VAULT_REQUEST,
  EXPORT_VAULT_RESPONSE,
  IMPORT_ACCOUNT_REQUEST,
  IMPORT_ACCOUNT_RESPONSE,
  IMPORT_VAULT_REQUEST,
  IMPORT_VAULT_RESPONSE,
  INITIALIZE_VAULT_REQUEST,
  INITIALIZE_VAULT_RESPONSE,
  LOCK_VAULT_REQUEST,
  LOCK_VAULT_RESPONSE,
  PK_ACCOUNT_REQUEST,
  PK_ACCOUNT_RESPONSE,
  REMOVE_ACCOUNT_REQUEST,
  REMOVE_ACCOUNT_RESPONSE,
  REMOVE_RECOVERY_PHRASE_REQUEST,
  REMOVE_RECOVERY_PHRASE_RESPONSE,
  REVOKE_EXTERNAL_SESSIONS_REQUEST,
  REVOKE_EXTERNAL_SESSIONS_RESPONSE,
  REVOKE_SESSION_REQUEST,
  REVOKE_SESSION_RESPONSE,
  SHOULD_EXPORT_VAULT_REQUEST,
  SHOULD_EXPORT_VAULT_RESPONSE,
  UNLOCK_VAULT_REQUEST,
  UNLOCK_VAULT_RESPONSE,
  UPDATE_ACCOUNT_REQUEST,
  UPDATE_ACCOUNT_RESPONSE,
  UPDATE_RECOVERY_PHRASE_REQUEST,
  UPDATE_RECOVERY_PHRASE_RESPONSE,
} from "../../constants/communication";
import { VaultBackupSchema } from "../../redux/slices/vault/backup";
import { UnknownError } from "../../errors/communication";
import { RemoveRecoveryPhraseOptions } from "../../redux/slices/vault/phrases";

export interface VaultRequestWithPass<T extends string> {
  type: T;
  data: {
    password: string;
  };
}

export interface InitializeVaultReq {
  type: typeof INITIALIZE_VAULT_REQUEST;
  data: {
    password: string;
    sessionsMaxAge: {
      enabled: boolean;
      maxAge: number;
    };
    requirePasswordForSensitiveOpts: boolean;
  };
}

export type InitializeVaultRes = BaseResponse<typeof INITIALIZE_VAULT_RESPONSE>;

export type UnlockVaultReq = VaultRequestWithPass<typeof UNLOCK_VAULT_REQUEST>;

type UnlockVaultResponseData = BaseData & {
  isPasswordWrong: boolean;
};

export type UnlockVaultRes = BaseResponse<
  typeof UNLOCK_VAULT_RESPONSE,
  UnlockVaultResponseData
>;

export interface LockVaultReq {
  type: typeof LOCK_VAULT_REQUEST;
}

export type LockVaultRes = BaseResponse<typeof LOCK_VAULT_RESPONSE>;

export interface RevokeSessionReq {
  type: typeof REVOKE_SESSION_REQUEST;
  data: {
    sessionId: string;
  };
}

export interface RevokeExternalSessionsReq {
  type: typeof REVOKE_EXTERNAL_SESSIONS_REQUEST;
}

export type RevokeSessionRes = BaseResponse<typeof REVOKE_SESSION_RESPONSE>;

export type RevokeExternalSessionsRes = BaseResponse<
  typeof REVOKE_EXTERNAL_SESSIONS_RESPONSE
>;

export interface UpdateAccountReq {
  type: typeof UPDATE_ACCOUNT_REQUEST;
  data: {
    id: string;
    name: string;
  };
}

export interface UpdateAccountRes {
  type: typeof UPDATE_ACCOUNT_RESPONSE;
  data: {
    answered: true;
    isPasswordWrong?: boolean;
  } | null;
  error: UnknownErrorType | null;
}

export interface RemoveAccountReq {
  type: typeof REMOVE_ACCOUNT_REQUEST;
  data: {
    serializedAccount: SerializedAccountReference;
    vaultPassword?: string;
  };
}

export interface RemoveAccountRes {
  type: typeof REMOVE_ACCOUNT_RESPONSE;
  data: {
    answered: true;
    isPasswordWrong?: boolean;
  } | null;
  error: UnknownErrorType | null;
}

export interface UpdateRecoveryPhraseReq {
  type: typeof UPDATE_RECOVERY_PHRASE_REQUEST;
  data: UpdateRecoveryPhraseRequest;
}

export interface UpdateRecoveryPhraseRes {
  type: typeof UPDATE_RECOVERY_PHRASE_RESPONSE;
  data: {
    answered: true;
    isPasswordWrong?: boolean;
  } | null;
  error: UnknownErrorType | null;
}

export interface RemoveRecoveryPhraseReq {
  type: typeof REMOVE_RECOVERY_PHRASE_REQUEST;
  data: RemoveRecoveryPhraseOptions;
}

export interface RemoveRecoveryPhraseRes {
  type: typeof REMOVE_RECOVERY_PHRASE_RESPONSE;
  data: {
    answered: true;
    isPasswordWrong?: boolean;
  } | null;
  error: UnknownErrorType | null;
}

export interface ImportAccountReq {
  type: typeof IMPORT_ACCOUNT_REQUEST;
  data: ImportAccountParam;
}

export interface ImportAccountRes {
  type: typeof IMPORT_ACCOUNT_RESPONSE;
  data: {
    answered: true;
    accountId: string;
    accountAlreadyExists?: boolean;
  } | null;
  error: UnknownErrorType | null;
}

export interface PrivateKeyAccountReq {
  type: typeof PK_ACCOUNT_REQUEST;
  data: {
    account: SerializedAccountReference;
    vaultPassword: string;
  };
}

export interface PrivateKeyAccountRes {
  type: typeof PK_ACCOUNT_RESPONSE;
  data: {
    answered: true;
    privateKey: string | null;
    isAccountPasswordWrong?: boolean;
    isVaultPasswordWrong?: boolean;
  } | null;
  error: UnknownErrorType | null;
}

export interface CheckPermissionForSessionReq {
  type: typeof CHECK_PERMISSION_FOR_SESSION_REQUEST;
  data: {
    sessionId: string;
    resource: string;
    action: string;
    ids?: string[];
  };
}

export interface CheckPermissionForSessionRes {
  type: typeof CHECK_PERMISSION_FOR_SESSION_RESPONSE;
  data: {
    sessionIsValid: boolean;
  } | null;
  error: UnknownErrorType | null;
}

export interface ExportVaultReq {
  type: typeof EXPORT_VAULT_REQUEST;
  data: {
    currentVaultPassword?: string;
    encryptionPassword?: string;
  };
}

export type ExportVaultRes = {
  type: typeof EXPORT_VAULT_RESPONSE;
} & (
  | {
      data: {
        vault: VaultBackupSchema | null;
        isPasswordWrong?: boolean;
      };
      error: null;
    }
  | { error: typeof UnknownError; data: null }
);

export interface ShouldExportVaultReq {
  type: typeof SHOULD_EXPORT_VAULT_REQUEST;
}

export type ShouldExportVaultRes = {
  type: typeof SHOULD_EXPORT_VAULT_RESPONSE;
} & (
  | {
      data: {
        shouldExportVault: boolean;
        hasVaultBeenExported: boolean;
      };
      error: null;
    }
  | { error: typeof UnknownError; data: null }
);

export interface ImportVaultReq {
  type: typeof IMPORT_VAULT_REQUEST;
  data: {
    vault: VaultBackupSchema;
    password: string;
  };
}

export type ImportVaultRes = BaseResponse<
  typeof IMPORT_VAULT_RESPONSE,
  UnlockVaultResponseData
>;
