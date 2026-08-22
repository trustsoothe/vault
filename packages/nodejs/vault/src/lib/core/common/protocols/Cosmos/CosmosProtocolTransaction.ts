import {IAbstractProtocolTransaction} from "../ProtocolTransaction";
import {SupportedProtocols} from "../../values";
import {CosmosTransactionTypes} from "./CosmosTransactionTypes";
import { PayloadUnionSchema } from './schemas';
import {z} from "zod";

export interface CosmosProtocolTransactionMessage {
  type: CosmosTransactionTypes;
  payload: z.input<typeof PayloadUnionSchema>;
}

export interface CosmosProtocolTransaction
  extends IAbstractProtocolTransaction<
    SupportedProtocols.Cosmos,
    typeof CosmosTransactionTypes
  > {
  protocol: SupportedProtocols.Cosmos;
  messages: CosmosProtocolTransactionMessage[];
  gasPrice?: number;
  gas?: 'auto' | number;
  gasAdjustment?: number;
  memo?: string;
  /**
   * Sign the transaction as an unordered transaction (Cosmos SDK >= 0.53):
   * no account sequence, identified by a timeout timestamp instead, so
   * several transactions can be sent from the same account within the same
   * block. Defaults to true.
   */
  unordered?: boolean;
}
