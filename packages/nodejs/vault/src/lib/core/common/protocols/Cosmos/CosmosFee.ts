import {IAbstractProtocolFee} from "../ProtocolFee";
import {SupportedProtocols} from "../../values";

export interface CosmosFee extends IAbstractProtocolFee<SupportedProtocols.Cosmos> {
  value: number;
  denom: string;
}
