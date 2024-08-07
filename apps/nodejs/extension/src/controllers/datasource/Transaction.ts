import { z } from "zod";
import browser from "webextension-polyfill";
import { SupportedProtocols } from "@poktscan/vault";
import { isValidAddress } from "../../utils/networkOperations";

export const BaseTransaction = z.object({
  hash: z.string(),
  from: z.string(),
  to: z.string(),
  chainId: z.string(),
  amount: z.number().min(0),
  rpcUrl: z.string().url(),
  timestamp: z.number(),
  requestedBy: z.string().url().optional(),
  swapTo: z
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
    .optional(),
});

export type BaseTransaction = z.infer<typeof BaseTransaction>;

export type SwapTo = BaseTransaction["swapTo"];

export const PoktTransaction = BaseTransaction.extend({
  protocol: z.literal(SupportedProtocols.Pocket),
  fee: z.number(),
  memo: z.string().optional(),
})
  .refine(
    (value) => isValidAddress(value.from, value.protocol),
    "invalid from address"
  )
  .refine(
    (value) => isValidAddress(value.to, value.protocol),
    "invalid to address"
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

export type Transaction = PoktTransaction | EthTransaction;

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
