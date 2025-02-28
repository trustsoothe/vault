import { RootState } from "../../store";
import type { VaultSliceBuilder } from "../../../types";
import TransactionDatasource, {
  BaseTransaction,
  PoktTransaction,
  SwapTo,
  Transaction,
} from "../../../controllers/datasource/Transaction";
import { createAsyncThunk, SerializedError } from "@reduxjs/toolkit";
import set from "lodash/set";
import {
  AccountReference,
  AccountType,
  AccountUpdateOptions,
  AddHDWalletAccountExternalRequest,
  Passphrase,
  PocketNetworkProtocolService,
  PocketNetworkProtocolTransaction,
  CosmosFee,
  PocketNetworkTransactionTypes,
  PrivateKeyRestoreErrorName,
  SerializedAccountReference,
  SerializedSession,
  SupportedProtocols,
  SupportedTransferOrigins,
  TransferOptions,
  VaultRestoreErrorName,
  DAOAction,
} from "@soothe/vault";
import { WebEncryptionService } from "@soothe/vault-encryption-web";
import { getVaultPassword, VaultSlice } from "./index";
import { getVault } from "../../../utils";
import {
  addImportedAccountAddress,
  addTransaction,
  removeImportedAccountAddress,
  setNetworksWithErrors,
} from "../app";
import {
  getAddressFromPrivateKey,
  isValidAddress,
  isValidPublicKey,
  runWithNetworks,
} from "../../../utils/networkOperations";
import {
  AnswerPoktTxRequests,
  PoktTxRequest,
} from "../../../types/communications/transactions";
import {
  ANSWER_CHANGE_PARAM_REQUEST,
  ANSWER_DAO_TRANSFER_REQUEST,
  ANSWER_STAKE_APP_REQUEST,
  ANSWER_STAKE_NODE_REQUEST,
  ANSWER_TRANSFER_APP_REQUEST,
  ANSWER_UNJAIL_NODE_REQUEST,
  ANSWER_UNSTAKE_APP_REQUEST,
  ANSWER_UNSTAKE_NODE_REQUEST,
  ANSWER_UPGRADE_REQUEST,
  CHANGE_PARAM_REQUEST,
  DAO_TRANSFER_REQUEST,
  STAKE_APP_REQUEST,
  STAKE_NODE_REQUEST,
  TRANSFER_APP_REQUEST,
  UNJAIL_NODE_REQUEST,
  UNSTAKE_APP_REQUEST,
  UNSTAKE_NODE_REQUEST,
} from "../../../constants/communication";

const MAX_PASSWORDS_TRIES = 4;
export const VAULT_PASSWORD_ID = "vault";
const ExtensionVaultInstance = getVault();

export type CreateNewAccountFromHdSeedArg = Omit<
  AddHDWalletAccountExternalRequest,
  "count"
>;

export const createNewAccountFromHdSeed = createAsyncThunk(
  "vault/createNewAccountFromHdSeed",
  async (options: CreateNewAccountFromHdSeedArg, context) => {
    const {
      vault: { vaultSession, accounts },
      app: { accountsImported },
    } = context.getState() as RootState;

    const vaultPassword = await getVaultPassword(vaultSession.id);
    const vaultPassphrase = new Passphrase(vaultPassword);

    const account = await ExtensionVaultInstance.addHDWalletAccount(
      vaultSession.id,
      vaultPassphrase,
      { ...options }
    );

    let seedAccount = accounts.find(
        (account) =>
          account.accountType === AccountType.HDSeed &&
          account.seedId === options.recoveryPhraseId &&
          account.protocol === options.protocol
      ),
      mustAddSeedAccount = false;

    if (!seedAccount) {
      mustAddSeedAccount = true;
      const accountsFromVault = await ExtensionVaultInstance.listAccounts(
        vaultSession.id
      );
      seedAccount = accountsFromVault
        .find(
          (account) =>
            account.accountType === AccountType.HDSeed &&
            account.seedId === options.recoveryPhraseId &&
            account.protocol === options.protocol
        )
        ?.serialize();

      if (!seedAccount) {
        console.log("Account was not found", { accountsFromVault, options });
      }
    }

    const parentIsImported = accountsImported.includes(
      options.recoveryPhraseId
    );

    if (parentIsImported) {
      await context.dispatch(addImportedAccountAddress(account.address));
    }

    return {
      childAccount: account.serialize(),
      seedAccount: mustAddSeedAccount ? seedAccount : null,
    };
  }
);

export const addNewAccount = createAsyncThunk<
  {
    accountReference: SerializedAccountReference;
    session: SerializedSession;
  },
  {
    sessionId?: string;
    name: string;
    protocol: SupportedProtocols;
    addressPrefix?: string;
  }
>("vault/addNewAccount", async (args, context) => {
  const state = context.getState() as RootState;
  const { vaultSession } = state.vault;

  const vaultPassword = await getVaultPassword(vaultSession.id);
  const vaultPassphrase = new Passphrase(vaultPassword);
  const session = args.sessionId || vaultSession.id;

  const accountReference = await ExtensionVaultInstance.createAccount(
    session,
    vaultPassphrase,
    {
      name: args.name.trim(),
      protocol: args.protocol,
      addressPrefix: args.addressPrefix,
    }
  );

  const updatedSession = await ExtensionVaultInstance.getSession(session);

  return {
    accountReference: accountReference.serialize(),
    session: updatedSession.serialize(),
  };
});

export interface ImportAccountParam {
  protocol: SupportedProtocols;
  name: string;
  privateKey: string;
  addressPrefix?: string;
}

export const importAccount = createAsyncThunk(
  "vault/importAccount",
  async (importOptions: ImportAccountParam, context) => {
    const state = context.getState() as RootState;
    const { vaultSession } = state.vault;
    const vaultPassword = await getVaultPassword(vaultSession.id);
    const vaultPassphrase = new Passphrase(vaultPassword);

    const accountReference =
      await ExtensionVaultInstance.createAccountFromPrivateKey(
        vaultSession.id,
        vaultPassphrase,
        importOptions
      );

    await context.dispatch(addImportedAccountAddress(accountReference.address));

    return accountReference.serialize();
  }
);

export const updateAccount = createAsyncThunk<
  SerializedAccountReference,
  AccountUpdateOptions
>("vault/updateAccount", async (arg, context) => {
  const {
    vault: { vaultSession },
  } = context.getState() as RootState;
  const vaultPassword = await getVaultPassword(vaultSession.id);
  const vaultPassphrase = new Passphrase(vaultPassword);

  const accountReference = await ExtensionVaultInstance.updateAccountName(
    vaultSession.id,
    vaultPassphrase,
    {
      id: arg.id,
      name: arg.name.trim(),
    }
  );

  return accountReference.serialize();
});

export const removeAccount = createAsyncThunk(
  "vault/removeAccount",
  async (
    args: {
      serializedAccount: SerializedAccountReference;
      vaultPassword?: string;
    },
    context
  ) => {
    const {
      vault: { vaultSession },
      app: { requirePasswordForSensitiveOpts },
    } = context.getState() as RootState;

    const { vaultPassword: passwordFromArg, serializedAccount } = args;
    const account = AccountReference.deserialize(serializedAccount);
    const vaultPassword =
      passwordFromArg || requirePasswordForSensitiveOpts
        ? passwordFromArg
        : await getVaultPassword(vaultSession.id);
    const vaultPassphrase = new Passphrase(vaultPassword);

    await ExtensionVaultInstance.removeAccount(
      vaultSession.id,
      vaultPassphrase,
      account
    );

    await context.dispatch(removeImportedAccountAddress(account.address));
  }
);

export interface GetPrivateKeyParam {
  account: SerializedAccountReference;
  vaultPassword: string;
}

export const getPrivateKeyOfAccount = createAsyncThunk<
  string,
  GetPrivateKeyParam
>("vault/getPrivateKeyOfAccount", async (arg, context) => {
  const state = context.getState() as RootState;
  const sessionId = state.vault.vaultSession.id;

  const vaultPassphrase = new Passphrase(arg.vaultPassword);
  return await ExtensionVaultInstance.getAccountPrivateKey(
    sessionId,
    vaultPassphrase,
    AccountReference.deserialize(arg.account)
  );
});

export interface SendTransactionParams
  extends Omit<TransferOptions, "transactionParams" | "network"> {
  network: {
    protocol: SupportedProtocols;
    chainID: string;
    addressPrefix?: string;
  };
  transactionParams: {
    maxFeePerGas?: number;
    maxPriorityFeePerGas?: number;
    data?: string;
    fee?: number;
    shannonFee?: CosmosFee;
    memo?: string;
    gasLimit?: number;
  };
  isRawTransaction?: boolean;
  metadata?: {
    requestedBy?: string;
    maxFeeAmount?: number;
    swapTo?: SwapTo;
    amountToSave?: number;
  };
}

export const sendTransfer = createAsyncThunk<string, SendTransactionParams>(
  "vault/sendTransfer",
  async ({ metadata, ...transferOptions }, context) => {
    const state = context.getState() as RootState;
    const sessionId = state.vault.vaultSession.id;

    const transactionArg: TransferOptions = {
      ...transferOptions,
      network: null,
      transactionParams: {
        from: "",
        to: "",
        amount: "",
        ...transferOptions.transactionParams,
      },
    };

    if (
      !state.app.requirePasswordForSensitiveOpts &&
      !transferOptions.from.passphrase
    ) {
      set(transactionArg, "from.passphrase", await getVaultPassword(sessionId));
    }

    const { result, rpcWithErrors, rpcUrl } = await runWithNetworks(
      {
        protocol: transferOptions.network.protocol,
        chainId: transferOptions.network.chainID,
        customRpcs: state.app.customRpcs,
        networks: state.app.networks,
        errorsPreferredNetwork: state.app.errorsPreferredNetwork,
      },
      async (network) => {
        transactionArg.network = network;
        if (transferOptions.isRawTransaction) {
          return await ExtensionVaultInstance.sendRawTransaction(
            sessionId,
            transactionArg
          );
        } else {
          return await ExtensionVaultInstance.transferFunds(
            sessionId,
            transactionArg
          );
        }
      }
    );

    if (rpcWithErrors.length) {
      await context.dispatch(setNetworksWithErrors(rpcWithErrors));
    }

    let fromAddress: string;

    if (transferOptions.from.type === SupportedTransferOrigins.VaultAccountId) {
      fromAddress = state.vault.accounts.find(
        (account) => account.id === transferOptions.from.value
      )?.address;
    } else {
      fromAddress = await getAddressFromPrivateKey(
        transferOptions.from.value,
        transferOptions.network.protocol,
        transferOptions.network.addressPrefix
      );
    }

    const baseTx: BaseTransaction = {
      hash: result.transactionHash,
      from: fromAddress,
      chainId: transferOptions.network.chainID,
      requestedBy: metadata?.requestedBy,
      swapTo: metadata?.swapTo,
      amount: transferOptions.amount,
      to: transferOptions.to.value,
      rpcUrl,
      timestamp: Date.now(),
    };

    let tx: Transaction;

    if (transferOptions.network.protocol === SupportedProtocols.Ethereum) {
      tx = {
        ...baseTx,
        protocol: SupportedProtocols.Ethereum,
        assetId: transferOptions.asset
          ? state.app.assets.find(
              (asset) =>
                asset.chainId === transferOptions.asset.chainID &&
                asset.protocol === transferOptions.asset.protocol &&
                asset.contractAddress === transferOptions.asset.contractAddress
            )?.id
          : undefined,
        data: transferOptions.transactionParams.data,
        isRawTransaction: transferOptions.isRawTransaction || false,
        maxFeePerGas: transferOptions.transactionParams.maxFeePerGas,
        maxPriorityFeePerGas:
          transferOptions.transactionParams.maxPriorityFeePerGas,
        gasLimit: transferOptions.transactionParams.gasLimit,
        maxFeeAmount: metadata?.maxFeeAmount || 0,
        amount: transferOptions.isRawTransaction
          ? metadata.amountToSave || transferOptions.amount
          : transferOptions.amount,
      };
    } else if (transferOptions.network.protocol === SupportedProtocols.Pocket) {
      tx = {
        ...baseTx,
        protocol: SupportedProtocols.Pocket,
        fee: transferOptions.transactionParams.fee,
        memo: transferOptions.transactionParams.memo,
      };
    } else if (transferOptions.network.protocol === SupportedProtocols.Cosmos) {
      tx = {
        ...baseTx,
        protocol: SupportedProtocols.Cosmos,
        fee: transferOptions.transactionParams.shannonFee.value,
        memo: transferOptions.transactionParams.memo,
      };
    }

    await TransactionDatasource.save(tx);

    context.dispatch(addTransaction(tx));

    return result.transactionHash;
  }
);

export const getPoktTxFromRequest = async ({
  state,
  request,
  privateKey,
  fee,
}: {
  state: RootState;
  request: PoktTxRequest;
  privateKey: string;
  fee: number;
}) => {
  let transaction: Partial<PocketNetworkProtocolTransaction>;

  const {
    vault: { vaultSession, accounts },
    app: { customRpcs, networks },
  } = state;

  const account = accounts.find(
    (account) =>
      account.address === request.transactionData.address &&
      account.protocol === SupportedProtocols.Pocket
  );

  switch (request.type) {
    case STAKE_NODE_REQUEST: {
      transaction = {
        protocol: SupportedProtocols.Pocket,
        transactionType: PocketNetworkTransactionTypes.NodeStake,
        from: request.transactionData.address,
        nodePublicKey:
          request.transactionData.operatorPublicKey ||
          (await ExtensionVaultInstance.getPublicKey(
            vaultSession.id,
            account.address
          )),
        outputAddress: request.transactionData.outputAddress || account.address,
        chains: request.transactionData.chains,
        amount: (Number(request.transactionData.amount) / 1e6).toString(),
        serviceURL: request.transactionData.serviceURL,
        rewardDelegators: request.transactionData.rewardDelegators,
        memo: request.transactionData.memo,
      };
      break;
    }
    case UNSTAKE_NODE_REQUEST: {
      transaction = {
        protocol: SupportedProtocols.Pocket,
        transactionType: PocketNetworkTransactionTypes.NodeUnstake,
        from:
          request.transactionData.nodeAddress ||
          request.transactionData.address,
        outputAddress: request.transactionData.address,
      };
      break;
    }
    case UNJAIL_NODE_REQUEST: {
      transaction = {
        protocol: SupportedProtocols.Pocket,
        transactionType: PocketNetworkTransactionTypes.NodeUnjail,
        from:
          request.transactionData.nodeAddress ||
          request.transactionData.address,
        outputAddress: request.transactionData.address,
      };
      break;
    }
    case STAKE_APP_REQUEST: {
      transaction = {
        protocol: SupportedProtocols.Pocket,
        transactionType: PocketNetworkTransactionTypes.AppStake,
        appPublicKey: await ExtensionVaultInstance.getPublicKey(
          vaultSession.id,
          account.address
        ),
        chains: request.transactionData.chains,
        amount: (Number(request.transactionData.amount) / 1e6).toString(),
      };
      break;
    }
    case TRANSFER_APP_REQUEST: {
      transaction = {
        protocol: SupportedProtocols.Pocket,
        transactionType: PocketNetworkTransactionTypes.AppTransfer,
        appPublicKey: request.transactionData.newAppPublicKey,
      };
      break;
    }
    case UNSTAKE_APP_REQUEST: {
      transaction = {
        protocol: SupportedProtocols.Pocket,
        transactionType: PocketNetworkTransactionTypes.AppUnstake,
        appAddress: request.transactionData.address,
      };
      break;
    }
    case CHANGE_PARAM_REQUEST: {
      transaction = {
        protocol: SupportedProtocols.Pocket,
        transactionType: PocketNetworkTransactionTypes.GovChangeParam,
        paramKey: request.transactionData.paramKey,
        paramValue: request.transactionData.paramValue,
        overrideGovParamsWhitelistValidation:
          request.transactionData.overrideGovParamsWhitelistValidation,
      };
      break;
    }
    case DAO_TRANSFER_REQUEST: {
      transaction = {
        protocol: SupportedProtocols.Pocket,
        transactionType: PocketNetworkTransactionTypes.GovDAOTransfer,
        from: request.transactionData.address,
        to: request.transactionData.to,
        amount: (Number(request.transactionData.amount) / 1e6).toString(),
        memo: request.transactionData.memo,
        daoAction: request.transactionData.daoAction as DAOAction,
      };
      break;
    }
    default: {
      throw new Error("Transaction type not supported");
    }
  }

  transaction.privateKey = privateKey;
  transaction.fee = fee;
  transaction.memo = request.transactionData.memo;

  const customRpc = customRpcs.find(
    (customRpc) =>
      customRpc.protocol === SupportedProtocols.Pocket &&
      customRpc.chainId === request.transactionData.chainId &&
      customRpc.isPreferred
  );

  const defaultNetwork = networks.find(
    (item) =>
      item.protocol === SupportedProtocols.Pocket &&
      item.chainId === request.transactionData.chainId
  );

  const rpcUrl = customRpc?.url || defaultNetwork.rpcUrl;

  return {
    transaction: transaction as PocketNetworkProtocolTransaction,
    network: {
      protocol: SupportedProtocols.Pocket,
      chainID: request.transactionData.chainId,
      rpcUrl,
    },
  };
};

export const sendPoktTx = createAsyncThunk(
  "vault/sendPoktTx",
  async (request: AnswerPoktTxRequests, context) => {
    const {
      vault: { vaultSession, accounts },
      app: {
        requirePasswordForSensitiveOpts,
        networks,
        customRpcs,
        errorsPreferredNetwork,
      },
    } = context.getState() as RootState;

    const account = accounts.find(
      (account) =>
        account.address === request.data.transactionData.address &&
        account.protocol === SupportedProtocols.Pocket
    );

    let transaction: Partial<PocketNetworkProtocolTransaction>;

    const {
      data: { fee, vaultPassword: passwordFromArg },
    } = request;

    switch (request.type) {
      case ANSWER_STAKE_NODE_REQUEST: {
        const transactionData = request.data.transactionData;

        let nodePublicKey: string;

        if (isValidPublicKey(transactionData.operatorPublicKey || "")) {
          nodePublicKey = transactionData.operatorPublicKey;
        } else if (
          transactionData.operatorPublicKey &&
          isValidAddress(
            transactionData.operatorPublicKey,
            SupportedProtocols.Pocket
          ) &&
          transactionData.operatorPublicKey !== transactionData.address
        ) {
          nodePublicKey = await ExtensionVaultInstance.getPublicKey(
            vaultSession.id,
            transactionData.operatorPublicKey
          );
        } else {
          nodePublicKey = await ExtensionVaultInstance.getPublicKey(
            vaultSession.id,
            account.address
          );
        }

        transaction = {
          protocol: SupportedProtocols.Pocket,
          transactionType: PocketNetworkTransactionTypes.NodeStake,
          from: transactionData.address,
          nodePublicKey,
          outputAddress: transactionData.outputAddress || account.address,
          chains: transactionData.chains,
          amount: (Number(transactionData.amount) / 1e6).toString(),
          serviceURL: transactionData.serviceURL,
          rewardDelegators:
            Object.keys(transactionData.rewardDelegators || {}).length > 0
              ? transactionData.rewardDelegators
              : undefined,
          memo: transactionData.memo,
        };
        break;
      }
      case ANSWER_UNSTAKE_NODE_REQUEST: {
        transaction = {
          protocol: SupportedProtocols.Pocket,
          transactionType: PocketNetworkTransactionTypes.NodeUnstake,
          from:
            request.data.transactionData.nodeAddress ||
            request.data.transactionData.address,
          outputAddress: request.data.transactionData.address,
        };
        break;
      }
      case ANSWER_UNJAIL_NODE_REQUEST: {
        transaction = {
          protocol: SupportedProtocols.Pocket,
          transactionType: PocketNetworkTransactionTypes.NodeUnjail,
          from:
            request.data.transactionData.nodeAddress ||
            request.data.transactionData.address,
          outputAddress: request.data.transactionData.address,
        };
        break;
      }
      case ANSWER_STAKE_APP_REQUEST: {
        transaction = {
          protocol: SupportedProtocols.Pocket,
          transactionType: PocketNetworkTransactionTypes.AppStake,
          appPublicKey: await ExtensionVaultInstance.getPublicKey(
            vaultSession.id,
            account.address
          ),
          chains: request.data.transactionData.chains,
          amount: (
            Number(request.data.transactionData.amount) / 1e6
          ).toString(),
        };
        break;
      }
      case ANSWER_TRANSFER_APP_REQUEST: {
        let newAppPublicKey: string;

        const transactionData = request.data.transactionData;

        if (isValidPublicKey(transactionData.newAppPublicKey || "")) {
          newAppPublicKey = transactionData.newAppPublicKey;
        } else if (
          transactionData.newAppPublicKey &&
          isValidAddress(
            transactionData.newAppPublicKey,
            SupportedProtocols.Pocket
          ) &&
          transactionData.newAppPublicKey !== transactionData.address
        ) {
          newAppPublicKey = await ExtensionVaultInstance.getPublicKey(
            vaultSession.id,
            transactionData.newAppPublicKey
          );
        } else {
          newAppPublicKey = await ExtensionVaultInstance.getPublicKey(
            vaultSession.id,
            account.address
          );
        }

        transaction = {
          protocol: SupportedProtocols.Pocket,
          transactionType: PocketNetworkTransactionTypes.AppTransfer,
          appPublicKey: newAppPublicKey,
        };
        break;
      }
      case ANSWER_UNSTAKE_APP_REQUEST: {
        transaction = {
          protocol: SupportedProtocols.Pocket,
          transactionType: PocketNetworkTransactionTypes.AppUnstake,
          appAddress: request.data.transactionData.address,
        };
        break;
      }
      case ANSWER_CHANGE_PARAM_REQUEST: {
        transaction = {
          from: request.data.transactionData.address,
          protocol: SupportedProtocols.Pocket,
          transactionType: PocketNetworkTransactionTypes.GovChangeParam,
          paramKey: request.data.transactionData.paramKey,
          paramValue: request.data.transactionData.paramValue,
          overrideGovParamsWhitelistValidation:
            request.data.transactionData.overrideGovParamsWhitelistValidation,
        };
        break;
      }
      case ANSWER_DAO_TRANSFER_REQUEST: {
        transaction = {
          protocol: SupportedProtocols.Pocket,
          transactionType: PocketNetworkTransactionTypes.GovDAOTransfer,
          from: request.data.transactionData.address,
          to: request.data.transactionData.to,
          amount: (
            Number(request.data.transactionData.amount) / 1e6
          ).toString(),
          daoAction: request.data.transactionData.daoAction as DAOAction,
        };
        break;
      }
      case ANSWER_UPGRADE_REQUEST: {
        if (request.data.transactionData.version === "FEATURE") {
          transaction = {
            protocol: SupportedProtocols.Pocket,
            transactionType: PocketNetworkTransactionTypes.GovUpgrade,
            from: request.data.transactionData.address,
            upgrade: {
              height: 1,
              version: request.data.transactionData.version,
              features: request.data.transactionData.features as string[],
              //@ts-ignore
              oldUpgradeHeight: 0,
            },
          };
        } else {
          transaction = {
            protocol: SupportedProtocols.Pocket,
            transactionType: PocketNetworkTransactionTypes.GovUpgrade,
            from: request.data.transactionData.address,
            upgrade: {
              height: Number(request.data.transactionData.height),
              version: request.data.transactionData.version,
              features: [],
              //@ts-ignore
              oldUpgradeHeight: 0,
            },
          };
        }

        break;
      }
      default: {
        throw new Error("Transaction type not supported");
      }
    }

    const vaultPassword =
      passwordFromArg || requirePasswordForSensitiveOpts
        ? passwordFromArg
        : await getVaultPassword(vaultSession.id);

    transaction.privateKey = await context
      .dispatch(
        getPrivateKeyOfAccount({
          account,
          vaultPassword,
        })
      )
      .unwrap();
    transaction.fee = fee;
    transaction.memo = request.data.transactionData.memo;

    const protocolService = new PocketNetworkProtocolService(
      new WebEncryptionService()
    );

    const { result, rpcWithErrors, rpcUrl } = await runWithNetworks(
      {
        protocol: SupportedProtocols.Pocket,
        chainId: request.data.transactionData.chainId,
        customRpcs,
        networks,
        errorsPreferredNetwork,
      },
      async (network) => {
        return await protocolService.sendTransaction(
          network,
          transaction as PocketNetworkProtocolTransaction
        );
      }
    );

    if (rpcWithErrors.length) {
      await context.dispatch(setNetworksWithErrors(rpcWithErrors));
    }

    const transactionToSave: PoktTransaction = {
      protocol: SupportedProtocols.Pocket,
      chainId: request.data.transactionData.chainId,
      from: request.data.transactionData.address,
      hash: result.transactionHash,
      requestedBy: request.data.request?.origin,
      amount: transaction.amount ? Number(transaction.amount) : 0,
      to: transaction.to || "",
      rpcUrl,
      timestamp: Date.now(),
      transactionParams: transaction,
      fee,
      type: transaction.transactionType,
    };

    await TransactionDatasource.save(transactionToSave);

    context.dispatch(addTransaction(transactionToSave));

    return result.transactionHash;
  }
);

const addAddNewAccountToBuilder = (builder: VaultSliceBuilder) => {
  builder.addCase(addNewAccount.rejected, (state, action) => {
    increaseWrongPasswordCounter(VAULT_PASSWORD_ID, state, action.error);
  });

  builder.addCase(addNewAccount.fulfilled, (state, action) => {
    const { accountReference, session } = action.payload;
    state.accounts.push(accountReference);

    const index = state.sessions.findIndex((item) => item.id === session.id);

    if (index !== -1) {
      state.sessions.splice(index, 1, session);
    }

    resetWrongPasswordCounter(VAULT_PASSWORD_ID, state);
  });
};

const addCreateNewAccountFromHdSeedToBuilder = (builder: VaultSliceBuilder) => {
  builder.addCase(createNewAccountFromHdSeed.rejected, (state, action) => {
    increaseWrongPasswordCounter(VAULT_PASSWORD_ID, state, action.error);
  });

  builder.addCase(createNewAccountFromHdSeed.fulfilled, (state, action) => {
    const { childAccount, seedAccount } = action.payload;
    state.accounts.push(childAccount);

    if (seedAccount) {
      state.accounts.push(seedAccount);
    }

    resetWrongPasswordCounter(VAULT_PASSWORD_ID, state);
  });
};

const addImportAccountToBuilder = (builder: VaultSliceBuilder) => {
  builder.addCase(importAccount.fulfilled, (state, action) => {
    const account = action.payload;

    state.accounts.push(account);
  });
};

const addUpdateAccountToBuilder = (builder: VaultSliceBuilder) => {
  builder.addCase(updateAccount.fulfilled, (state, action) => {
    const account = action.payload;

    const index = state.accounts.findIndex((item) => item.id === account.id);

    if (index !== -1) {
      state.accounts.splice(index, 1, account);
    }
  });
};

const addRemoveAccountToBuilder = (builder: VaultSliceBuilder) => {
  builder.addCase(removeAccount.fulfilled, (state, action) => {
    const accountId = action.meta.arg.serializedAccount.id;
    const wasVaultPasswordPassed = !!action.meta.arg.vaultPassword;

    state.accounts = state.accounts.filter((item) => item.id !== accountId);

    if (wasVaultPasswordPassed) {
      resetWrongPasswordCounter(VAULT_PASSWORD_ID, state);
    }
  });

  builder.addCase(removeAccount.rejected, (state, action) => {
    increaseWrongPasswordCounter(VAULT_PASSWORD_ID, state, action.error);
  });
};

const addGetPrivateKeyToBuilder = (builder: VaultSliceBuilder) => {
  builder.addCase(getPrivateKeyOfAccount.fulfilled, (state) => {
    resetWrongPasswordCounter(VAULT_PASSWORD_ID, state);
  });
  builder.addCase(getPrivateKeyOfAccount.rejected, (state, action) => {
    increaseWrongPasswordCounter(VAULT_PASSWORD_ID, state, action.error);
  });
};

const addSendTransferToBuilder = (builder: VaultSliceBuilder) => {
  builder.addCase(sendTransfer.fulfilled, (state, action) => {
    if (!!action.meta.arg.from.passphrase) {
      resetWrongPasswordCounter(VAULT_PASSWORD_ID, state);
    }
  });

  builder.addCase(sendTransfer.rejected, (state, action) => {
    if (!!action.meta.arg.from.passphrase) {
      increaseWrongPasswordCounter(VAULT_PASSWORD_ID, state, action.error);
    }
  });
};

const addSendPoktTxToBuilder = (builder: VaultSliceBuilder) => {
  builder.addCase(sendPoktTx.fulfilled, (state, action) => {
    if (!!action.meta.arg.data.vaultPassword) {
      resetWrongPasswordCounter(VAULT_PASSWORD_ID, state);
    }
  });

  builder.addCase(sendPoktTx.rejected, (state, action) => {
    if (!!action.meta.arg.data.vaultPassword) {
      increaseWrongPasswordCounter(VAULT_PASSWORD_ID, state, action.error);
    }
  });
};

export const addAccountThunksToBuilder = (builder: VaultSliceBuilder) => {
  addAddNewAccountToBuilder(builder);
  addImportAccountToBuilder(builder);
  addUpdateAccountToBuilder(builder);
  addRemoveAccountToBuilder(builder);
  addGetPrivateKeyToBuilder(builder);
  addSendTransferToBuilder(builder);
  addSendPoktTxToBuilder(builder);
  addCreateNewAccountFromHdSeedToBuilder(builder);
};

export function resetWrongPasswordCounter(id: string, state: VaultSlice) {
  state.wrongPasswordCounter[id] = undefined;
}

export function increaseWrongPasswordCounter(
  id: string,
  state: VaultSlice,
  error: SerializedError
) {
  if (
    error?.name === VaultRestoreErrorName ||
    error?.name === PrivateKeyRestoreErrorName
  ) {
    const currentCounter = state.wrongPasswordCounter[id];

    if (currentCounter === MAX_PASSWORDS_TRIES) {
      ExtensionVaultInstance.lockVault();
      state.vaultSession = null;
      state.isUnlockedStatus = "locked_due_wrong_password";
      state.accounts = [];
      state.sessions = [];
      state.wrongPasswordCounter = {};
      return;
    }

    state.wrongPasswordCounter[id] =
      typeof currentCounter === "number" ? currentCounter + 1 : 1;
  }
}
