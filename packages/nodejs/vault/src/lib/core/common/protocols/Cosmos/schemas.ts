import { z } from 'zod'
import { COSMOS_PROTOCOL } from '../../values'
import { CosmosTransactionTypes } from './CosmosTransactionTypes'
import { SupportedProtocols } from '../../values'
import { ConfigOptions, RPCType, SupplierServiceConfig } from './pocket/client/pocket/shared/service'
import { coins } from '@cosmjs/proto-signing'

function poktToUPoktCoin(amount: string) {
  const amountInUpokt = (parseInt(amount) * 1e6).toString()
  return coins(amountInUpokt, 'upokt')
}

export const PocketShannonProtocolNetworkSchema = z.object({
  protocol: z.literal(COSMOS_PROTOCOL),
  chainID: z.string(),
  rpcUrl: z.string().url(),
})

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
})

export const ConfigOptionSchema = z.object({
  key: z.nativeEnum(ConfigOptions),
  value: z.string(),
})

export const SupplierEndpointSchema = z.object({
  url: z.string(),
  rpcType: z.nativeEnum(RPCType),
  configs: z.array(ConfigOptionSchema),
})

export const ServiceRevenueShareSchema = z.object({
  address: z.string(),
  revSharePercentage: z.number(),
})

export const SupplierServiceConfigSchema = z.object({
  serviceId: z.string(),
  endpoints: z.array(SupplierEndpointSchema),
  revShare: z.array(ServiceRevenueShareSchema),
})

export const MsgSendSchema = z.object({
  fromAddress: z.string(),
  toAddress: z.string(),
  amount: z.string().transform((amount) => poktToUPoktCoin(amount)),
})

export const MsgStakeSupplierSchema = z.object({
  signer: z.string(),
  ownerAddress: z.string(),
  operatorAddress: z.string(),
  stake: z.string().transform((stake) => poktToUPoktCoin(stake).at(0)!),
  services: z.array(SupplierServiceConfigSchema),
})

export const MsgUnstakeSupplierSchema = z.object({
  signer: z.string(),
  operatorAddress: z.string(),
})

export const MsgClaimSupplierSchema = z.object({
  shannonSigningAddress: z.string(),
  shannonOwnerAddress: z.string(),
  shannonOperatorAddress: z.string(),
  morsePublicKey: z.string(),
  morseSignature: z.string(),
  services: z.array(SupplierServiceConfigSchema),
})

export const MsgClaimAccountSchema = z.object({
  shannonSigningAddress: z.string(),
  shannonDestAddress: z.string(),
  morsePublicKey: z.string(),
  morseSignature: z.string(),
})

export const PayloadUnionSchema = z.union([
  MsgSendSchema,
  MsgStakeSupplierSchema,
  MsgUnstakeSupplierSchema,
  MsgClaimSupplierSchema,
  MsgClaimAccountSchema,
])

export const CosmosProtocolTransactionMessageSchema = z.object({
  type: z.nativeEnum(CosmosTransactionTypes),
  payload: PayloadUnionSchema,
})

export const CosmosProtocolTransactionSchema = z.object({
  protocol: z.literal(SupportedProtocols.Cosmos),
  messages: z.array(CosmosProtocolTransactionMessageSchema),
  gasPrice: z.coerce.number().optional(),
  gasLimit: z.number().optional(),
  memo: z.string().optional(),
})
