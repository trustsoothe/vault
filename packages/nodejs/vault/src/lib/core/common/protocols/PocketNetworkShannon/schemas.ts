import {z} from "zod";
import {POCKET_NETWORK_SHANNON_PROTOCOL} from "../../values";
import { PocketNetworkShannonTransactionTypes } from './PocketNetworkShannonTransactionTypes';
import { SupportedProtocols } from '../../values';

export const PocketShannonProtocolNetworkSchema = z.object({
  protocol: z.literal(POCKET_NETWORK_SHANNON_PROTOCOL),
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

const SupportedProtocolsEnum = z.enum([SupportedProtocols.PocketShannon]);

const PocketNetworkShannonTransactionTypesEnum = z.nativeEnum(PocketNetworkShannonTransactionTypes);

const PocketNetworkShannonFeeSchema = z.object({
  value: z.number(),
  denom: z.string().min(1, 'Denomination cannot be empty'),
});

export const PocketNetworkShannonProtocolTransactionSchema = z.object({
  protocol: SupportedProtocolsEnum,
  transactionType: PocketNetworkShannonTransactionTypesEnum,
  from: z.string().min(1, 'From address cannot be empty'),
  to: z.string().min(1, 'To address cannot be empty'),
  amount: z.string().min(1, 'Amount cannot be empty'),
  privateKey: z.string().min(1, 'Private key cannot be empty'),
  skipValidation: z.boolean().optional(),
  fee: PocketNetworkShannonFeeSchema,
});

