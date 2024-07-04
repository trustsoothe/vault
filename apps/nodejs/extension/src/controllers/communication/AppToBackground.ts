import type {
  NetworkFeeReq,
  NetworkFeeRes,
  SetRequirePasswordForOptsReq,
  SetRequirePasswordForOptsRes,
} from "../../types/communications/app";
import type {
  AccountBalanceReq,
  AccountBalanceRes,
} from "../../types/communications/balance";
import type {
  AnswerConnectionReq,
  AnswerConnectionRes,
} from "../../types/communications/connection";
import type {
  AnswerNewAccountReq,
  AnswerNewAccountRes,
} from "../../types/communications/newAccount";
import type {
  AnswerPersonalSignReq,
  AnswerPersonalSignRes,
} from "../../types/communications/personalSign";
import type {
  AnswerSignedTypedDataReq,
  AnswerSignedTypedDataRes,
} from "../../types/communications/signTypedData";
import type {
  AnswerSwitchChainReq,
  AnswerSwitchChainRes,
} from "../../types/communications/switchChain";
import type {
  AnswerTransferReq,
  AnswerTransferRes,
} from "../../types/communications/transfer";
import type {
  CheckPermissionForSessionReq,
  CheckPermissionForSessionRes,
  ExportVaultReq,
  ExportVaultRes,
  ImportAccountReq,
  ImportAccountRes,
  ImportVaultReq,
  ImportVaultRes,
  InitializeVaultReq,
  InitializeVaultRes,
  LockVaultReq,
  LockVaultRes,
  PrivateKeyAccountReq,
  PrivateKeyAccountRes,
  RemoveAccountReq,
  RemoveAccountRes,
  RemoveRecoveryPhraseReq,
  RemoveRecoveryPhraseRes,
  RevokeExternalSessionsReq,
  RevokeExternalSessionsRes,
  RevokeSessionReq,
  RevokeSessionRes,
  ShouldExportVaultReq,
  ShouldExportVaultRes,
  UnlockVaultReq,
  UnlockVaultRes,
  UpdateAccountReq,
  UpdateAccountRes,
  UpdateRecoveryPhraseReq,
  UpdateRecoveryPhraseRes,
} from "../../types/communications/vault";
import browser from "webextension-polyfill";
import {
  ACCOUNT_BALANCE_REQUEST,
  ANSWER_CONNECTION_REQUEST,
  ANSWER_NEW_ACCOUNT_REQUEST,
  ANSWER_PERSONAL_SIGN_REQUEST,
  ANSWER_SIGNED_TYPED_DATA_REQUEST,
  ANSWER_SWITCH_CHAIN_REQUEST,
  ANSWER_TRANSFER_REQUEST,
  CHECK_PERMISSION_FOR_SESSION_REQUEST,
  CREATE_ACCOUNT_FROM_HD_SEED_REQUEST,
  EXPORT_VAULT_REQUEST,
  GET_RECOVERY_PHRASE_ID_REQUEST,
  IMPORT_ACCOUNT_REQUEST,
  IMPORT_HD_WALLET_REQUEST,
  IMPORT_VAULT_REQUEST,
  INITIALIZE_VAULT_REQUEST,
  LOCK_VAULT_REQUEST,
  NETWORK_FEE_REQUEST,
  PK_ACCOUNT_REQUEST,
  REMOVE_ACCOUNT_REQUEST,
  REMOVE_RECOVERY_PHRASE_REQUEST,
  REVOKE_EXTERNAL_SESSIONS_REQUEST,
  REVOKE_SESSION_REQUEST,
  SET_REQUIRE_PASSWORD_FOR_OPTS_REQUEST,
  SHOULD_EXPORT_VAULT_REQUEST,
  UNLOCK_VAULT_REQUEST,
  UPDATE_ACCOUNT_REQUEST,
  UPDATE_RECOVERY_PHRASE_REQUEST,
} from "../../constants/communication";
import {
  CreateAccountFromHdSeedReq,
  CreateAccountFromHdSeedRes,
  GetRecoveryPhraseIdReq,
  GetRecoveryPhraseIdRes,
  ImportHdWalletReq,
  ImportHdWalletRes,
} from "../../types/communications/hdWallet";

export default class AppToBackground {
  static async answerConnection(
    data: AnswerConnectionReq["data"]
  ): Promise<AnswerConnectionRes> {
    const message: AnswerConnectionReq = {
      type: ANSWER_CONNECTION_REQUEST,
      data,
    };
    return browser.runtime.sendMessage(message);
  }

  static async answerNewAccount(
    data: AnswerNewAccountReq["data"]
  ): Promise<AnswerNewAccountRes> {
    const message: AnswerNewAccountReq = {
      type: ANSWER_NEW_ACCOUNT_REQUEST,
      data,
    };
    return browser.runtime.sendMessage(message);
  }

  static async importAccount(
    data: ImportAccountReq["data"]
  ): Promise<ImportAccountRes> {
    const message: ImportAccountReq = {
      type: IMPORT_ACCOUNT_REQUEST,
      data,
    };

    return browser.runtime.sendMessage(message);
  }

  static async updateAccount(
    data: UpdateAccountReq["data"]
  ): Promise<UpdateAccountRes> {
    const message: UpdateAccountReq = {
      type: UPDATE_ACCOUNT_REQUEST,
      data,
    };
    return browser.runtime.sendMessage(message);
  }

  static async removeAccount(
    data: RemoveAccountReq["data"]
  ): Promise<RemoveAccountRes> {
    const message: RemoveAccountReq = {
      type: REMOVE_ACCOUNT_REQUEST,
      data,
    };
    return browser.runtime.sendMessage(message);
  }

  static async getAccountPrivateKey(
    data: PrivateKeyAccountReq["data"]
  ): Promise<PrivateKeyAccountRes> {
    const message: PrivateKeyAccountReq = {
      type: PK_ACCOUNT_REQUEST,
      data,
    };

    return browser.runtime.sendMessage(message);
  }

  static async sendRequestToAnswerTransfer(
    data: AnswerTransferReq["data"]
  ): Promise<AnswerTransferRes> {
    const message: AnswerTransferReq = {
      type: ANSWER_TRANSFER_REQUEST,
      data,
    };
    return browser.runtime.sendMessage(message);
  }

  static async initializeVault(
    data: InitializeVaultReq["data"]
  ): Promise<InitializeVaultRes> {
    const message: InitializeVaultReq = {
      type: INITIALIZE_VAULT_REQUEST,
      data,
    };
    return browser.runtime.sendMessage(message);
  }

  static async unlockVault(password: string): Promise<UnlockVaultRes> {
    const message: UnlockVaultReq = {
      type: UNLOCK_VAULT_REQUEST,
      data: {
        password,
      },
    };
    return browser.runtime.sendMessage(message);
  }

  static async lockVault(): Promise<LockVaultRes> {
    const message: LockVaultReq = {
      type: LOCK_VAULT_REQUEST,
    };
    return browser.runtime.sendMessage(message);
  }

  static async revokeSession(sessionId: string): Promise<RevokeSessionRes> {
    const message: RevokeSessionReq = {
      type: REVOKE_SESSION_REQUEST,
      data: {
        sessionId,
      },
    };
    return browser.runtime.sendMessage(message);
  }

  static async revokeAllExternalSessions(): Promise<RevokeExternalSessionsRes> {
    const message: RevokeExternalSessionsReq = {
      type: REVOKE_EXTERNAL_SESSIONS_REQUEST,
    };
    return browser.runtime.sendMessage(message);
  }

  static async getAccountBalance(
    data: AccountBalanceReq["data"]
  ): Promise<AccountBalanceRes> {
    const message: AccountBalanceReq = {
      type: ACCOUNT_BALANCE_REQUEST,
      data,
    };
    return browser.runtime.sendMessage(message);
  }

  static async getNetworkFee(
    data: NetworkFeeReq["data"]
  ): Promise<NetworkFeeRes> {
    const message: NetworkFeeReq = {
      type: NETWORK_FEE_REQUEST,
      data,
    };
    return browser.runtime.sendMessage(message);
  }

  static async checkPermissionForSession(
    data: CheckPermissionForSessionReq["data"]
  ): Promise<CheckPermissionForSessionRes> {
    const message: CheckPermissionForSessionReq = {
      type: CHECK_PERMISSION_FOR_SESSION_REQUEST,
      data,
    };
    return browser.runtime.sendMessage(message);
  }

  static async answerSwitchChain(
    data: AnswerSwitchChainReq["data"]
  ): Promise<AnswerSwitchChainRes> {
    const message: AnswerSwitchChainReq = {
      type: ANSWER_SWITCH_CHAIN_REQUEST,
      data,
    };
    return browser.runtime.sendMessage(message);
  }

  static async answerSignTypedData(
    data: AnswerSignedTypedDataReq["data"]
  ): Promise<AnswerSignedTypedDataRes> {
    const message: AnswerSignedTypedDataReq = {
      type: ANSWER_SIGNED_TYPED_DATA_REQUEST,
      data,
    };

    return browser.runtime.sendMessage(message);
  }

  static async answerPersonalSign(
    data: AnswerPersonalSignReq["data"]
  ): Promise<AnswerPersonalSignRes> {
    const message: AnswerPersonalSignReq = {
      data,
      type: ANSWER_PERSONAL_SIGN_REQUEST,
    };

    return browser.runtime.sendMessage(message);
  }

  static async exportVault(
    data: ExportVaultReq["data"]
  ): Promise<ExportVaultRes> {
    const message: ExportVaultReq = {
      type: EXPORT_VAULT_REQUEST,
      data,
    };

    return browser.runtime.sendMessage(message);
  }

  static async shouldExportVault(): Promise<ShouldExportVaultRes> {
    const message: ShouldExportVaultReq = {
      type: SHOULD_EXPORT_VAULT_REQUEST,
    };

    return browser.runtime.sendMessage(message);
  }

  static async importVault(
    data: ImportVaultReq["data"]
  ): Promise<ImportVaultRes> {
    const message: ImportVaultReq = {
      type: IMPORT_VAULT_REQUEST,
      data,
    };

    return browser.runtime.sendMessage(message);
  }

  static async setRequirePasswordForOpts(
    data: SetRequirePasswordForOptsReq["data"]
  ): Promise<SetRequirePasswordForOptsRes> {
    const message: SetRequirePasswordForOptsReq = {
      type: SET_REQUIRE_PASSWORD_FOR_OPTS_REQUEST,
      data,
    };

    return browser.runtime.sendMessage(message);
  }

  static async importHdWallet(
    data: ImportHdWalletReq["data"]
  ): Promise<ImportHdWalletRes> {
    const message: ImportHdWalletReq = {
      type: IMPORT_HD_WALLET_REQUEST,
      data,
    };

    return browser.runtime.sendMessage(message);
  }

  static async createAccountFromHdSeed(
    data: CreateAccountFromHdSeedReq["data"]
  ): Promise<CreateAccountFromHdSeedRes> {
    const message: CreateAccountFromHdSeedReq = {
      type: CREATE_ACCOUNT_FROM_HD_SEED_REQUEST,
      data,
    };

    return browser.runtime.sendMessage(message);
  }

  static async updateRecoveryPhrase(
    data: UpdateRecoveryPhraseReq["data"]
  ): Promise<UpdateRecoveryPhraseRes> {
    const message: UpdateRecoveryPhraseReq = {
      type: UPDATE_RECOVERY_PHRASE_REQUEST,
      data,
    };

    return browser.runtime.sendMessage(message);
  }

  static async removeRecoveryPhrase(
    data: RemoveRecoveryPhraseReq["data"]
  ): Promise<RemoveRecoveryPhraseRes> {
    const message: RemoveRecoveryPhraseReq = {
      type: REMOVE_RECOVERY_PHRASE_REQUEST,
      data,
    };

    return browser.runtime.sendMessage(message);
  }

  static async getRecoveryPhraseId(
    data: GetRecoveryPhraseIdReq["data"]
  ): Promise<GetRecoveryPhraseIdRes> {
    const message: GetRecoveryPhraseIdReq = {
      type: GET_RECOVERY_PHRASE_ID_REQUEST,
      data,
    };

    return browser.runtime.sendMessage(message);
  }
}
