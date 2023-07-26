import {queryBalanceHandlerFactory} from "./queryBalance.handler";
import {queryFeeHandlerFactory} from "./queryFee.handler";
import {sendTransactionHandlerFactory} from "./sendTransaction.handler";

export default (baseUrl: string) => [
  queryFeeHandlerFactory(baseUrl),
  queryBalanceHandlerFactory(baseUrl),
  sendTransactionHandlerFactory(baseUrl),
]
