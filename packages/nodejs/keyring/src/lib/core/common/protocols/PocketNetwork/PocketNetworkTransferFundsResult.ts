import {PocketNetworkProtocol} from "./PocketNetworkProtocol";
import {ITransferFundsResult} from "../IProtocolService";

export interface PocketNetworkTransferFundsResult extends ITransferFundsResult<PocketNetworkProtocol> {
  transactionHash: string
}
