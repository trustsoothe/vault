export interface DefaultError {
  name: string;
  code: number;
  message: string;
}

export const NotConnected: Readonly<DefaultError> = Object.freeze({
  name: "NOT_CONNECTED",
  code: 1,
  message: "You are not connected with the vault extension",
});

export const OriginNotPresented: Readonly<DefaultError> = Object.freeze({
  name: "ORIGIN_NOT_PRESENTED",
  code: 1,
  message: "The origin was not presented in the payload.",
});

export const FromAddressNotPresented: Readonly<DefaultError> = Object.freeze({
  name: "FROM_ADDRESS_NOT_PRESENTED",
  code: 3,
  message: "fromAddress was not presented in the payload.",
});

export const ToAddressNotPresented: Readonly<DefaultError> = Object.freeze({
  name: "TO_ADDRESS_NOT_PRESENTED",
  code: 4,
  message: "toAddress was not presented in the payload.",
});

export const AmountNotPresented: Readonly<DefaultError> = Object.freeze({
  name: "AMOUNT_ADDRESS_NOT_PRESENTED",
  code: 4,
  message: "amount was not presented in the payload.",
});

export const SessionIdNotPresented: Readonly<DefaultError> = Object.freeze({
  name: "SESSION_NOT_PRESENTED",
  code: 2,
  message: "The sessionId was not presented in the payload.",
});

export const RequestConnectionExists: Readonly<DefaultError> = Object.freeze({
  name: "REQUEST_CONNECTION_ALREADY_EXISTS",
  code: 1000,
  message: "There is a pending connect request from this origin.",
});

export const RequestNewAccountExists: Readonly<DefaultError> = Object.freeze({
  name: "REQUEST_NEW_ACCOUNT_ALREADY_EXISTS",
  code: 1001,
  message: "There is a pending new account request from this origin.",
});

export const RequestTransferExists: Readonly<DefaultError> = Object.freeze({
  name: "REQUEST_TRANSFER_ALREADY_EXISTS",
  code: 1002,
  message: "There is a pending transfer request from this origin.",
});

export const InvalidSession: Readonly<DefaultError> = Object.freeze({
  name: "INVALID_SESSION",
  code: 500,
  message: "Unauthorized. The provided sessionId is not valid.",
});

export const ForbiddenSession: Readonly<DefaultError> = Object.freeze({
  name: "FORBIDDEN_SESSION",
  code: 500,
  message:
    "Forbidden. The provided session does not have the rights to perform the requested operation.",
});
