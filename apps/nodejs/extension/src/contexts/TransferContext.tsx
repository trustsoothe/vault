import type { FormValues } from "../components/Transfer";
import type { EthereumNetworkFee, PocketNetworkFee } from "@poktscan/keyring";
import React, { createContext, useContext } from "react";
import { useFormContext } from "react-hook-form";
import { SupportedProtocols } from "@poktscan/keyring";

export type FetchStatus = "not-fetched" | "loading" | "error" | "fetched";

export type Status = "loading" | "error" | "form" | "summary" | "submitted";

export interface ExternalTransferData {
  amount: string;
  fromAddress?: string;
  toAddress: string;
  memo?: string;
  /**required in mint transfer*/
  signatures?: string[];
  /**required in mint transfer*/
  mintInfo?: {
    recipient: string;
    amount: string;
    nonce: string;
  };
  /**required in bridge transfer*/
  vaultAddress?: string;
  data?: string;
  gasLimit?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
}

export enum TransferType {
  /**normal is used to transfer between the same protocol.*/
  normal = "normal",
  /**bridge is used to start the transfer from POKT to wPOKT.*/
  bridge = "bridge",
  /**burn is used to transfer from wPOKT to POKT.*/
  burn = "burn",
  /**mint is used to finish the transfer from POKT to wPOKT by paying the fee required by ETH.*/
  mint = "mint",
}

const TransferContext = createContext(undefined);

interface TransferContextProviderProps {
  children: React.ReactNode;
  networkFee?: EthereumNetworkFee | PocketNetworkFee;
  feeFetchStatus?: FetchStatus;
  getNetworkFee: () => void;
  externalTransferData?: ExternalTransferData;
  transferType: TransferType;
  status: Status;
}

const TransferContextProvider: React.FC<TransferContextProviderProps> = ({
  children,
  ...otherProps
}) => {
  const { watch } = useFormContext<FormValues>();
  const [protocol, feeSpeed] = watch(["protocol", "feeSpeed"]);
  const isPokt = protocol === SupportedProtocols.Pocket;

  const { networkFee } = otherProps;

  const feeSelected = Number(
    (isPokt
      ? (networkFee as PocketNetworkFee)?.value
      : (networkFee as EthereumNetworkFee)?.[feeSpeed]?.amount) || 0
  );

  return (
    <TransferContext.Provider
      value={
        {
          ...otherProps,
          disableInputs: !!otherProps.externalTransferData,
          feeSelected,
          isPokt,
        } as UseTransferContext
      }
    >
      {children}
    </TransferContext.Provider>
  );
};

export type UseTransferContext = Omit<
  TransferContextProviderProps,
  "children"
> & {
  isPokt: boolean;
  feeSelected: number;
  disableInputs: boolean;
};

export const useTransferContext = (): UseTransferContext => {
  const context = useContext(TransferContext);
  if (context === undefined) {
    throw new Error("Transfer Context must be used within a Provider");
  }

  return context;
};

export default TransferContextProvider;
