import type {
  ImportRecoveryPhraseOptions,
  SerializedAccountReference,
} from "@poktscan/keyring";
import {
  IMPORT_HD_WALLET_REQUEST,
  IMPORT_HD_WALLET_RESPONSE,
} from "../../constants/communication";
import { UnknownError } from "../../errors/communication";

export interface ImportHdWalletReq {
  type: typeof IMPORT_HD_WALLET_REQUEST;
  data: ImportRecoveryPhraseOptions;
}

export interface ImportHdWalletRes {
  type: typeof IMPORT_HD_WALLET_RESPONSE;
  data: {
    answered: true;
    accounts: SerializedAccountReference[];
  };
  error: typeof UnknownError | null;
}
