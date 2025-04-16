import {IAbstractProtocolTransaction} from "../ProtocolTransaction";
import {SupportedProtocols} from "../../values";
import {CosmosTransactionTypes} from "./CosmosTransactionTypes";
import { PayloadUnionSchema } from './schemas';
import {z} from "zod";

export interface CosmosProtocolTransactionMessage {
  type: CosmosTransactionTypes;
  payload: z.infer<typeof PayloadUnionSchema>;
}

export interface CosmosProtocolTransaction
  extends IAbstractProtocolTransaction<
    SupportedProtocols.Cosmos,
    typeof CosmosTransactionTypes
  > {
  protocol: SupportedProtocols.Cosmos;
  messages: CosmosProtocolTransactionMessage[];
  gasPrice?: number;
  gasLimit?: number;
  memo?: string;
}
