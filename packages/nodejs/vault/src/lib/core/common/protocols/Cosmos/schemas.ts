import {z} from "zod";
import {COSMOS_PROTOCOL} from "../../values";
import { CosmosTransactionTypes } from './CosmosTransactionTypes';
import { SupportedProtocols } from '../../values';

export const PocketShannonProtocolNetworkSchema = z.object({
  protocol: z.literal(COSMOS_PROTOCOL),
  chainID: z.enum(['poktroll']),
  rpcUrl: z.string().url(),
});

export const PocketShannonRpcCanSendTransactionResponseSchema = z.object({
  jsonrpc: z.literal('2.0'),
  id: z.number(),
  result: z.object({
    code: z.number(),
    data: z.string(),
    log: z.string(),
    codespace: z.string(),
    hash: z.string(),
  }),
});

const SupportedProtocolsEnum = z.enum([SupportedProtocols.Cosmos]);

const CosmosTransactionTypesEnum = z.nativeEnum(CosmosTransactionTypes);

const CosmosFeeSchema = z.object({
  value: z.number(),
  denom: z.string().min(1, 'Denomination cannot be empty'),
});

export const CosmosProtocolTransactionSchema = z.object({
  protocol: SupportedProtocolsEnum,
  transactionType: CosmosTransactionTypesEnum,
  from: z.string().min(1, 'From address cannot be empty'),
  to: z.string().min(1, 'To address cannot be empty'),
  amount: z.string().regex(/^\d+$/),
  privateKey: z.string().min(1, 'Private key cannot be empty'),
  skipValidation: z.boolean().optional(),
  fee: CosmosFeeSchema,
});

