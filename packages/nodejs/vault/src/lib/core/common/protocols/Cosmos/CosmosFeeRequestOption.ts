import {IAbstractProtocolFeeRequestOptions} from "../ProtocolFeeRequestOptions";
import {SupportedProtocols} from "../../values";
import {CosmosProtocolTransaction} from "./CosmosProtocolTransaction";

export interface CosmosFeeRequestOption
  extends IAbstractProtocolFeeRequestOptions<SupportedProtocols.Cosmos> {
  transaction: CosmosProtocolTransaction;
}
