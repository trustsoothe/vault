import {IAbstractProtocolTransaction} from "../ProtocolTransaction";
import {SupportedProtocols} from "../../values";
import {CosmosTransactionTypes} from "./CosmosTransactionTypes";
import {CosmosFee} from "./CosmosFee";

export interface CosmosProtocolTransaction
  extends IAbstractProtocolTransaction<
    SupportedProtocols.Cosmos,
    typeof CosmosTransactionTypes
  > {
  protocol: SupportedProtocols.Cosmos;
  transactionType: CosmosTransactionTypes;
  fee?: CosmosFee;
  memo?: string;
}
