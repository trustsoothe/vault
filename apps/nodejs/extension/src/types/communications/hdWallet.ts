import type {
  SerializedAccountReference,
  SerializedRecoveryPhraseReference,
} from "@poktscan/vault";
import type { CreateNewAccountFromHdSeedArg } from "../../redux/slices/vault/account";
import {
  CREATE_ACCOUNT_FROM_HD_SEED_REQUEST,
  CREATE_ACCOUNT_FROM_HD_SEED_RESPONSE,
  GET_RECOVERY_PHRASE_ID_REQUEST,
  GET_RECOVERY_PHRASE_ID_RESPONSE,
  IMPORT_HD_WALLET_REQUEST,
  IMPORT_HD_WALLET_RESPONSE,
  PHRASE_GENERATED_HD_SEED_REQUEST,
  PHRASE_GENERATED_HD_SEED_RESPONSE,
} from "../../constants/communication";
import { UnknownError } from "../../errors/communication";
import { ImportRecoveryPhraseOptions } from "../../redux/slices/vault/phrases";

export interface ImportHdWalletReq {
  type: typeof IMPORT_HD_WALLET_REQUEST;
  data: ImportRecoveryPhraseOptions;
}

export interface GetRecoveryPhraseIdReq {
  type: typeof GET_RECOVERY_PHRASE_ID_REQUEST;
  data: {
    recoveryPhrase: string;
    passphrase?: string;
  };
}

export interface GetRecoveryPhraseIdRes {
  type: typeof GET_RECOVERY_PHRASE_ID_RESPONSE;
  data: {
    recoveryPhraseId: string;
  };
  error: typeof UnknownError | null;
}

export interface ImportHdWalletRes {
  type: typeof IMPORT_HD_WALLET_RESPONSE;
  data: {
    answered: true;
    phraseAlreadyExists?: boolean;
    phraseId?: string;
    phrase: SerializedRecoveryPhraseReference;
  };
  error: typeof UnknownError | null;
}

export interface CreateAccountFromHdSeedReq {
  type: typeof CREATE_ACCOUNT_FROM_HD_SEED_REQUEST;
  data: CreateNewAccountFromHdSeedArg;
}

export interface CreateAccountFromHdSeedRes {
  type: typeof CREATE_ACCOUNT_FROM_HD_SEED_RESPONSE;
  data: {
    answered: true;
    account: SerializedAccountReference;
  };
  error: typeof UnknownError | null;
}

export interface PhraseGeneratedHdSeedReq {
  type: typeof PHRASE_GENERATED_HD_SEED_REQUEST;
  data: {
    accountId: string;
    vaultPassword?: string;
    phraseOptions: ImportRecoveryPhraseOptions;
  };
}

export interface PhraseGeneratedHdSeedRes {
  type: typeof PHRASE_GENERATED_HD_SEED_RESPONSE;
  data: {
    vaultPasswordWrong: boolean;
    isPhraseValid: boolean;
  } | null;
  error: typeof UnknownError | null;
}
