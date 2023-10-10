import {commonRPCHandlerFactory, commonRPCFailureHandlerFactory} from "./ethCommonRPC.handler";

export const successfulHandlersFactory = (baseUrl: string) => [
  commonRPCHandlerFactory(baseUrl),
]

export const failureHandlerFactory = (baseUrl: string) => [
  commonRPCFailureHandlerFactory(baseUrl),
]
