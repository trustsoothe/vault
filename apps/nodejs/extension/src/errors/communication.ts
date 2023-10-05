import { MINUTES_ALLOWED_FOR_REQ } from "../constants/communication";

function createError<N extends string, C extends number, M extends string>(
  name: N,
  code: C,
  message: M
) {
  return Object.freeze({
    name,
    code,
    message,
  });
}

export const UnknownError = createError(
  "UNKNOWN_ERROR",
  0,
  "An unhandled error occur trying to process your request."
);

export const VaultIsLocked = createError(
  "VAULT_IS_LOCKED",
  12,
  "The vault is locked."
);

export const NotConnected = createError(
  "NOT_CONNECTED",
  1,
  "You are not connected with the vault extension"
);

export const OriginNotPresented = createError(
  "ORIGIN_NOT_PRESENTED",
  2,
  "The origin was not presented in the payload."
);

export const FromAddressNotPresented = createError(
  "FROM_ADDRESS_NOT_PRESENTED",
  3,
  "fromAddress was not presented in the payload."
);

export const ToAddressNotPresented = createError(
  "TO_ADDRESS_NOT_PRESENTED",
  4,
  "toAddress was not presented in the payload."
);

export const AmountNotPresented = createError(
  "AMOUNT_ADDRESS_NOT_PRESENTED",
  5,
  "amount was not presented in the payload."
);

export const FromAddressNotValid = createError(
  "FROM_ADDRESS_NOT_VALID",
  7,
  "fromAddress is not valid."
);

export const ToAddressNotValid = createError(
  "TO_ADDRESS_NOT_VALID",
  8,
  "toAddress is not valid."
);

export const AmountNotValid = createError(
  "AMOUNT_NOT_VALID",
  9,
  "amount is not valid."
);

export const FeeNotValid = createError(
  "FEE_NOT_VALID",
  19,
  "fee is not valid."
);

export const MemoNotValid = createError(
  "MEMO_NOT_VALID",
  13,
  "memo is not valid."
);

export const ProtocolNotPresented = createError(
  "PROTOCOL_NOT_PRESENTED",
  17,
  "protocol was not presented in the payload."
);

export const InvalidProtocol = createError(
  "INVALID_PROTOCOL",
  14,
  "The protocol passed is not valid."
);

export const AmountHigherThanBalance = createError(
  "AMOUNT_HIGHER_THAN_BALANCE",
  15,
  "The amount passed + the fee is higher than the account balance."
);

export const FeeLowerThanMinFee = createError(
  "FEE_HIGHER_THAN_MIN_FEE",
  20,
  "The passed fee is lower than the min fee supported."
);

export const InvalidBody = createError(
  "INVALID_BODY",
  6,
  "The data passed is not valid."
);

export const SessionIdNotPresented = createError(
  "SESSION_NOT_PRESENTED",
  10,
  "The sessionId was not presented in the payload."
);

export const InvalidPermission = createError(
  "INVALID_PERMISSION",
  11,
  "An invalid permission was provided."
);

export const RequestConnectionExists = createError(
  "REQUEST_CONNECTION_ALREADY_EXISTS",
  1000,
  "There is a pending connect request from this origin."
);

export const RequestNewAccountExists = createError(
  "REQUEST_NEW_ACCOUNT_ALREADY_EXISTS",
  1001,
  "There is a pending new account request from this origin."
);

export const RequestTransferExists = createError(
  "REQUEST_TRANSFER_ALREADY_EXISTS",
  1002,
  "There is a pending transfer request from this origin."
);

export const InvalidSession = createError(
  "INVALID_SESSION",
  500,
  "Unauthorized. The provided sessionId is not valid."
);

export const ForbiddenSession = createError(
  "FORBIDDEN_SESSION",
  501,
  "Forbidden. The provided session does not have the rights to perform the requested operation."
);

export const OriginBlocked = createError(
  "ORIGIN_BLOCKED",
  502,
  "This website is blocked."
);

export const RequestTimeout = createError(
  "REQUEST_TIMEOUT",
  503,
  `The request was not answered between the ${MINUTES_ALLOWED_FOR_REQ} minutes allowed.`
);

export const OperationRejected = createError(
  "OPERATION_REJECTED_BY_USER",
  504,
  `The operation was rejected by the user.`
);
