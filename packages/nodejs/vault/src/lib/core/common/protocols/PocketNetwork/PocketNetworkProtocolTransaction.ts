import {SupportedProtocols} from "../../values";
import {IAbstractProtocolTransaction} from "../ProtocolTransaction";
import {PocketNetworkTransactionTypes} from "./PocketNetworkTransactionTypes";
export interface PocketNetworkProtocolTransaction extends IAbstractProtocolTransaction<SupportedProtocols.Pocket, typeof PocketNetworkTransactionTypes> {
    protocol: SupportedProtocols.Pocket;
    transactionType: PocketNetworkTransactionTypes;
    fee?: number;
    memo?: string;
}
