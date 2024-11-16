import {IAbstractProtocolTransaction} from "../ProtocolTransaction";
import {SupportedProtocols} from "../../values";
import {PocketNetworkShannonTransactionTypes} from "./PocketNetworkShannonTransactionTypes";
import {PocketNetworkShannonFee} from "./PocketNetworkShannonFee";

export interface PocketNetworkShannonProtocolTransaction
  extends IAbstractProtocolTransaction<
    SupportedProtocols.PocketShannon,
    typeof PocketNetworkShannonTransactionTypes
  > {
  protocol: SupportedProtocols.PocketShannon;
  transactionType: PocketNetworkShannonTransactionTypes;
  fee: PocketNetworkShannonFee;
}
