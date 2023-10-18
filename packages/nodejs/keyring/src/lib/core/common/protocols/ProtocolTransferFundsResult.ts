import {SupportedProtocols} from "../values";

export interface IAbstractTransferFundsResult<T extends SupportedProtocols> {
  protocol: T;
  transactionHash: string;
}
