import {
  ANSWER_MIGRATE_MORSE_ACCOUNT_REQUEST,
  ANSWER_MIGRATE_MORSE_ACCOUNT_RESPONSE,
} from "../../constants/communication";
import { UnknownError } from "../../errors/communication";

export type AnswerMigrateMorseAccountReq = {
  type: typeof ANSWER_MIGRATE_MORSE_ACCOUNT_REQUEST;
  data: {
    shannonChainId: string;
    morseAddress: string;
    shannonAddress: string;
    vaultPassword?: string;
  };
};

export type AnswerMigrateMorseAccountRes = {
  type: typeof ANSWER_MIGRATE_MORSE_ACCOUNT_RESPONSE;
  data: {
    isPasswordWrong?: boolean;
    hash?: string;
  };
  error: null | typeof UnknownError;
};
