import { MINUTES_ALLOWED_FOR_REQ } from "../constants/communication";

function createError<N extends string, C extends number, M extends string>(
  code: C,
  message: M
) {
  return Object.freeze({
    code,
    message,
  });
}

export const UnknownError = createError(
  0,
  "An unhandled error occur trying to process your request."
);

export const UnauthorizedError = createError(
  4100,
  "The requested method and/or account has not been authorized by the user."
);

export const UnsupportedMethod = createError(4200, "Method not supported.");

export const OriginNotPresented = createError(
  -32602,
  "The origin was not presented in the payload."
);

export const FromAddressNotPresented = createError(
  -32602,
  "from was not presented in the payload."
);

export const ToAddressNotPresented = createError(
  -32602,
  "to was not presented in the payload."
);

export const AmountNotPresented = createError(
  -32602,
  "amount was not presented in the payload."
);

export const FromAddressNotValid = createError(-32602, "from is not valid.");

export const AddressNotValid = createError(-32602, "address is not valid.");

export const BlockNotSupported = createError(
  -32602,
  "Block passed is not valid. Only latest is supported."
);

export const ToAddressNotValid = createError(-32602, "to is not valid.");

export const AmountNotValid = createError(-32602, "amount is not valid.");

export const MemoNotValid = createError(-32602, "memo is not valid.");

export const ProtocolNotPresented = createError(
  -32602,
  "protocol was not presented in the payload."
);

export const InvalidProtocol = createError(
  -32602,
  "The protocol passed is not valid."
);

export const InvalidBody = createError(-32602, "The data passed is not valid.");

export const SessionIdNotPresented = createError(
  -32602,
  "The sessionId was not presented in the payload."
);

export const RequestConnectionExists = createError(
  -32602,
  "There is a pending requestAccounts request."
);

export const RequestNewAccountExists = createError(
  -32602,
  "There is a pending createAccount request."
);

export const RequestTransferExists = createError(
  -32602,
  "There is a pending sendTransaction request."
);

export const RequestSwitchChainExists = createError(
  -32602,
  "There is a pending switch chain request from this origin and protocol."
);

export const UnrecognizedChainId = createError(4092, "Unrecognized chain ID.");

export const ChainIdNotPresented = createError(
  -32602,
  "Chain ID not presented."
);

export const RequestTimeout = createError(
  -32602,
  `The request was not answered between the ${MINUTES_ALLOWED_FOR_REQ} minutes allowed.`
);

export const OperationRejected = createError(
  4001,
  "The user rejected the request."
);

export const ProviderNotReady = createError(
  -1,
  "The provider is not ready to receive requests yet."
);

export const propertyIsNotValid = (property: string) =>
  createError(-32602, `${property} is not valid`);
