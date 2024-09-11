import { SupportedProtocols } from "../../values";
import { IAbstractProtocolTransaction } from "../ProtocolTransaction";
import { PocketNetworkTransactionTypes } from "./PocketNetworkTransactionTypes";
import { DAOAction } from "./pocket-js";
import { Upgrade } from "./pocket-js/models/proto/generated/tx-signer";

export interface PocketNetworkProtocolTransaction
  extends IAbstractProtocolTransaction<
    SupportedProtocols.Pocket,
    typeof PocketNetworkTransactionTypes
  > {
  protocol: SupportedProtocols.Pocket;
  transactionType: PocketNetworkTransactionTypes;
  nodePublicKey?: string;
  outputAddress?: string;
  fee?: number;
  memo?: string;
  appPublicKey?: string;
  chains?: string[];
  appAddress?: string;
  serviceURL?: string;
  rewardDelegators?: { [key: string]: number };
  daoAction?: DAOAction;
  paramKey?: string;
  paramValue?: string;
  overrideGovParamsWhitelistValidation?: boolean;
  upgrade?: Omit<Upgrade, "oldUpgradeHeight">;
}

export enum PocketNetworkTransactionValidationResults {
  InvalidSigner = "Signing account does not match the node or output address",
  OutputAddressChanged = "The transaction will change the output address",
  OutputAddressNotOwned = "The output address is not known to be owned by the signer",
}
