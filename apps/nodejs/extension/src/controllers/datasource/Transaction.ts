import { z } from "zod";
import browser from "webextension-polyfill";
import {
  DAOAction,
  CosmosTransactionTypes,
  PocketNetworkTransactionTypes,
  SupportedProtocols,
} from "@soothe/vault";
import {
  isValidAddress,
  isValidPublicKey,
} from "../../utils/networkOperations";
import { getSchemaFromParamKey } from "../../ui/PoktTransaction/ChangeParam/schemas";

export enum TransactionStatus {
  Successful,
  Invalid,
}

export const SwapSchema = z
  .object({
    address: z.string(),
    network: z.object({
      protocol: z.nativeEnum(SupportedProtocols),
      chainId: z.string(),
    }),
    assetId: z.string().uuid().optional(),
  })
  .refine(
    (value) => isValidAddress(value.address, value.network.protocol),
    "invalid swap to address"
  )
  .optional();

export const BaseTransaction = z.object({
  hash: z.string(),
  from: z.string(),
  to: z.string(),
  chainId: z.string(),
  amount: z.number().min(0),
  rpcUrl: z.string().url(),
  timestamp: z.number(),
  requestedBy: z.string().url().optional(),
  swapTo: SwapSchema,
  swapFrom: SwapSchema,
  status: z
    .nativeEnum(TransactionStatus)
    .optional()
    .default(TransactionStatus.Successful),
  code: z.number().optional().default(0),
});

export type BaseTransaction = z.infer<typeof BaseTransaction>;

export type SwapTo = BaseTransaction["swapTo"];

export const PoktShannonTransaction = BaseTransaction.extend({
  protocol: z.literal(SupportedProtocols.Cosmos),
  fee: z.number(),
  memo: z.string().optional(),
  to: z.string().optional(),
  type: z
    .nativeEnum(CosmosTransactionTypes)
    .default(CosmosTransactionTypes.Send),
  transactionParams: z
    .object({
      maxFeePerGas: z.number(),
      memo: z.string().optional(),
    })
    .optional(),
  codespace: z.string().optional(),
  log: z.string().optional(),
});

export const PoktTransaction = BaseTransaction.extend({
  protocol: z.literal(SupportedProtocols.Pocket),
  fee: z.number(),
  memo: z.string().optional(),
  to: z.string().optional(),
  type: z
    .nativeEnum(PocketNetworkTransactionTypes)
    .default(PocketNetworkTransactionTypes.Send),
  transactionParams: z
    .object({
      // todo: add validation for this
      to: z.string().optional(),
      nodePublicKey: z
        .string()
        .optional()
        .refine(
          (value) => !value || isValidPublicKey(value),
          "invalid node public key"
        ),
      outputAddress: z
        .string()
        .optional()
        .refine(
          (value) => !value || isValidAddress(value, SupportedProtocols.Pocket),
          "invalid output address"
        ),
      memo: z.string().optional(),
      appPublicKey: z
        .string()
        .optional()
        .refine(
          (value) => !value || isValidPublicKey(value),
          "invalid app public key"
        ),
      chains: z.array(z.string()).optional(),
      appAddress: z
        .string()
        .optional()
        .refine(
          (value) => !value || isValidAddress(value, SupportedProtocols.Pocket),
          "invalid app address"
        ),
      serviceURL: z.string().url().optional(),
      rewardDelegators: z.record(z.string(), z.number()).optional(),
      daoAction: z.nativeEnum(DAOAction).optional(),
      paramKey: z.string().optional(),
      paramValue: z.string().optional(),
      overrideGovParamsWhitelistValidation: z
        .boolean()
        .optional()
        .default(false),
      upgrade: z
        .object({
          height: z.number().int(),
          oldUpgradeHeight: z.number().int().optional().default(0),
          version: z.union([
            z.string().regex(/^(\d+)\.(\d+)\.(\d+)(\.(\d+))?$/),
            z.literal("FEATURE"),
          ]),
          features: z
            .array(
              z
                .string()
                .regex(
                  /^[A-Za-z]+:\d+$/,
                  "malformed feature, format should be: KEY:HEIGHT"
                )
            )
            .optional()
            .default([]),
        })
        .optional(),
    })
    .optional(),
})
  .refine((value) => isValidAddress(value.from, value.protocol), {
    path: ["from"],
    message: "invalid from address",
  })
  .refine(
    (value) =>
      (!value.to && value.type !== PocketNetworkTransactionTypes.Send) ||
      isValidAddress(value.to, value.protocol),
    {
      path: ["to"],
      message: "invalid to address",
    }
  )
  .refine(
    (value) => {
      if (value.type === PocketNetworkTransactionTypes.GovChangeParam) {
        const { schema } = getSchemaFromParamKey(
          value.transactionParams.paramKey,
          value.transactionParams.paramValue
        );

        let valueParsed = value.transactionParams.paramValue;

        const valueIsObject =
          schema instanceof z.ZodObject || schema instanceof z.ZodArray;

        if (valueIsObject) {
          try {
            valueParsed = JSON.parse(valueParsed);
          } catch {
            return false;
          }
        }

        try {
          schema.parse(valueParsed);
        } catch {
          return false;
        }
      }

      return true;
    },
    {
      path: ["transactionParams", "paramValue"],
      message: "invalid param value",
    }
  );

export type PoktTransaction = z.infer<typeof PoktTransaction>;

export const EthTransaction = BaseTransaction.extend({
  isMint: z.boolean().optional().default(false),
  protocol: z.literal(SupportedProtocols.Ethereum),
  isRawTransaction: z.boolean(),
  data: z.string().optional(),
  assetId: z.string().optional(),
  gasLimit: z.number(),
  maxFeePerGas: z.number(),
  maxPriorityFeePerGas: z.number(),
  maxFeeAmount: z.number(),
})
  .refine(
    (value) => isValidAddress(value.from, value.protocol),
    "invalid from address"
  )
  .refine(
    (value) => isValidAddress(value.to, value.protocol),
    "invalid to address"
  );

export type EthTransaction = z.infer<typeof EthTransaction>;

export type PoktShannonTransaction = z.infer<typeof PoktShannonTransaction>;

export type Transaction =
  | PoktTransaction
  | EthTransaction
  | PoktShannonTransaction;

const TRANSACTIONS_BASE_STORAGE_KEY = "tx";

export default class TransactionDatasource {
  static async getTransactionsByNetwork(
    protocol: SupportedProtocols,
    chainId: string
  ): Promise<Array<Transaction>> {
    const key = this.getStorageKey(protocol, chainId);

    return browser.storage.local
      .get({ [key]: [] })
      .then((res) => res[key] || []);
  }

  static async save(rawTransaction: Transaction): Promise<void> {
    let transaction: Transaction;

    switch (rawTransaction.protocol) {
      case "Pocket":
        transaction = PoktTransaction.parse(rawTransaction);
        break;
      case "Ethereum":
        transaction = EthTransaction.parse(rawTransaction);
        break;
      case "Cosmos":
        transaction = PoktShannonTransaction.parse(rawTransaction);
        break;
      default:
        throw new Error("Unsupported protocol");
    }

    const key = this.getStorageKey(transaction.protocol, transaction.chainId);

    const savedTransactions = await this.getTransactionsByNetwork(
      transaction.protocol,
      transaction.chainId
    );

    await browser.storage.local.set({
      [key]: [...savedTransactions, transaction],
    });
  }

  static async saveMany(rawTransactions: Array<Transaction>): Promise<void> {
    if (rawTransactions.length === 0) return;

    const transactions = rawTransactions.map((t) => {
      switch (t.protocol) {
        case "Pocket":
          return PoktTransaction.parse(t);
        case "Ethereum":
          return EthTransaction.parse(t);
        case "Cosmos":
          return PoktShannonTransaction.parse(t);
        default:
          throw new Error("Unsupported protocol");
      }
    });

    const chainIdAndProtocol = Object.entries(
      transactions.reduce(
        (acc, t) => ({
          ...acc,
          [t.protocol]: [...(acc[t.protocol] || []), t.chainId],
        }),
        {}
      ) as Record<string, Array<string>>
    )
      .map(([protocol, chainIds]) => ({
        protocol,
        chainIds: Array.from(new Set(chainIds)),
      }))
      .reduce(
        (acc, { protocol, chainIds }) => [
          ...acc,
          ...chainIds.map((chainId) => ({ protocol, chainId })),
        ],
        []
      );

    const transactionsByKey: Record<
      string,
      Array<Transaction>
    > = await Promise.all(
      chainIdAndProtocol.map(async ({ protocol, chainId }) => ({
        key: this.getStorageKey(protocol, chainId),
        transactions: await this.getTransactionsByNetwork(protocol, chainId),
      }))
    ).then((res) =>
      res.reduce(
        (acc, { key, transactions }) => ({ ...acc, [key]: transactions }),
        {}
      )
    );

    for (const rawTransaction of rawTransactions) {
      const key = this.getStorageKey(
        rawTransaction.protocol,
        rawTransaction.chainId
      );

      transactionsByKey[key].push(rawTransaction);
    }

    await browser.storage.local.set(transactionsByKey);
  }

  static async getTransactionsOfNetworks(
    networks: Array<{
      protocol: SupportedProtocols;
      chainId: string;
    }>
  ): Promise<Array<Transaction>> {
    return Promise.all(
      networks.map(({ protocol, chainId }) =>
        this.getTransactionsByNetwork(protocol, chainId)
      )
    ).then((res) => res.reduce((acc, txs) => [...acc, ...txs], []));
  }

  private static getStorageKey(
    protocol: SupportedProtocols,
    chainId: string
  ): string {
    return `${TRANSACTIONS_BASE_STORAGE_KEY}_${protocol}_${chainId}`;
  }
}
