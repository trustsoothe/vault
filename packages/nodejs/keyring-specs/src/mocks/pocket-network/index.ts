import {queryBalanceFailureHandlerFactory, queryBalanceHandlerFactory} from "./queryBalance.handler";
import {queryFeeFailureHandlerFactory, queryFeeHandlerFactory} from "./queryFee.handler";
import {sendTransactionHandlerFactory} from "./sendTransaction.handler";

export const successfulHandlersFactory = (baseUrl: string) => [
  queryFeeHandlerFactory(baseUrl),
  queryBalanceHandlerFactory(baseUrl),
  sendTransactionHandlerFactory(baseUrl),
]

export const failureHandlerFactory = (baseUrl: string) => [
  queryFeeFailureHandlerFactory(baseUrl),
  queryBalanceFailureHandlerFactory(baseUrl),
  sendTransactionHandlerFactory(baseUrl),
]
