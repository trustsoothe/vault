import type {
  ImportRecoveryPhraseOptions,
  SerializedAccountReference,
} from "@poktscan/keyring";
import type {
  CreateNewAccountFromHdSeedArg,
  ImportHdAccountOptions,
} from "../../redux/slices/vault/account";
import {
  CREATE_ACCOUNT_FROM_HD_SEED_REQUEST,
  CREATE_ACCOUNT_FROM_HD_SEED_RESPONSE,
  IMPORT_HD_WALLET_REQUEST,
  IMPORT_HD_WALLET_RESPONSE,
  PHRASE_GENERATED_HD_SEED_REQUEST,
  PHRASE_GENERATED_HD_SEED_RESPONSE,
} from "../../constants/communication";
import { UnknownError } from "../../errors/communication";

export interface ImportHdWalletReq {
  type: typeof IMPORT_HD_WALLET_REQUEST;
  data: ImportHdAccountOptions;
}

export interface ImportHdWalletRes {
  type: typeof IMPORT_HD_WALLET_RESPONSE;
  data: {
    answered: true;
    accounts: SerializedAccountReference[];
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
