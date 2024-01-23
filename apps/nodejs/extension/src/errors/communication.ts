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

export const BlockNotSupported = createError(
  -32602,
  "Block passed is not valid. Only latest is supported."
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

export const RequestSignedTypedDataExists = createError(
  -32602,
  "There is a pending signed typed data request from this origin and protocol."
);

export const RequestPersonalSignExists = createError(
  -32602,
  "There is a pending personal sign request from this origin and protocol."
);

export const UnrecognizedChainId = createError(4092, "Unrecognized chain ID.");
export const ChainIdIsNotActive = createError(
  -32603,
  "Provided chainId is not"
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

export const propertyIsRequired = (property: string) =>
  createError(-32602, `${property} is required`);

export const propertyOfTypeIsNotValid = (property: string, type: string) =>
  createError(-32602, `${property} of type ${type} is not valid`);

export const typeIsNotValid = (type: string) =>
  createError(-32602, `type ${type} is not valid`);
