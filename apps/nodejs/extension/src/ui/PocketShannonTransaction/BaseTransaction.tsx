import BaseDialog from "../components/BaseDialog";
import { getTransactionTypeLabel } from "../Request/PoktTransactionRequest";
import Stack from "@mui/material/Stack";
import CircularProgress from "@mui/material/CircularProgress";
import { FormProvider } from "react-hook-form";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import DialogButtons from "../components/DialogButtons";
import React from "react";
import StakeSupplierSummary from "./StakeSupplier/Summary/Summary";
import { useAppSelector } from "../hooks/redux";
import { selectedAccountByProtocolSelector } from "../../redux/selectors/account";
import { SupportedProtocols } from "@soothe/vault";
import {
  selectedChainByProtocolSelector,
  selectedProtocolSelector,
} from "../../redux/selectors/network";

export interface MsgStakeSupplier {
  /** The Bech32 address of the message signer (i.e. owner or operator) */
  signer: string;
  /** The Bech32 address of the owner (i.e. custodial, staker) */
  ownerAddress: string;
  /** The Bech32 address of the operator (i.e. provider, non-custodial) */
  operatorAddress: string;
  /** The total amount of uPOKT the supplier has staked. Must be ≥ to the current amount that the supplier has staked (if any) */
  stake?: Coin;
  /** The list of services this supplier is staked to provide service for */
  services: SupplierServiceConfig[];
}

export interface Coin {
  denom: string;
  amount: string;
}

export interface SupplierServiceConfig {
  /** The Service ID for which the supplier is configured */
  serviceId: string;
  /** List of endpoints for the service */
  endpoints: SupplierEndpoint[];
  /**
   * List of revenue share configurations for the service
   * TODO_MAINNET: There is an opportunity for supplier to advertise the min
   * they're willing to earn for a certain configuration/price, but this is outside of scope.
   */
  revShare: ServiceRevenueShare[];
}

export interface ServiceRevenueShare {
  /** The Bech32 address of the revenue share recipient */
  address: string;
  /** The percentage of revenue share the recipient will receive */
  revSharePercentage: number;
}

export interface SupplierEndpoint {
  /** URL of the endpoint */
  url: string;
  /** Type of RPC exposed on the url above */
  rpcType: RPCType;
  /** Additional configuration options for the endpoint */
  configs: ConfigOption[];
}

export interface ConfigOption {
  /** Config option key */
  key: ConfigOptions;
  /** Config option value */
  value: string;
}

export enum ConfigOptions {
  /** UNKNOWN_CONFIG - Undefined config option */
  UNKNOWN_CONFIG = 0,
  /**
   * TIMEOUT - Timeout setting
   * Add new config options here as needed
   */
  TIMEOUT = 1,
  UNRECOGNIZED = -1,
}

export enum RPCType {
  /** UNKNOWN_RPC - Undefined RPC type */
  UNKNOWN_RPC = 0,
  /** GRPC - gRPC */
  GRPC = 1,
  /** WEBSOCKET - WebSocket */
  WEBSOCKET = 2,
  /** JSON_RPC - JSON-RPC */
  JSON_RPC = 3,
  /**
   * REST - REST
   * Add new RPC types here as needed
   */
  REST = 4,
  UNRECOGNIZED = -1,
}

export interface ShannonTransactionFormValues {
  signer: string;
  ownerAddress: string;
  operatorAddress: string;
  stakeAmount?: string;
  supplierServices: SupplierServiceConfig[];
}

interface BaseShannonTransactionProps {
  open: boolean;
  onClose: () => void;
}

export default function BaseShannonTransaction({
  open,
  onClose,
}: BaseShannonTransactionProps) {
  const fromAddress = useAppSelector(selectedAccountByProtocolSelector)[
    SupportedProtocols.Cosmos
  ];
  const chainId =
    useAppSelector(selectedChainByProtocolSelector)[
      SupportedProtocols.Cosmos
    ] || "pocket";

  const selectedProtocol = useAppSelector(selectedProtocolSelector);

  return (
    <BaseDialog
      open={open}
      onClose={onClose}
      // title={type ? getTransactionTypeLabel(type) : ""}
      title={"Stake Supplier"}
      component={"form"}
      id={"shannon-transaction-form"}
      // onSubmit={handleSubmit(onSubmit)}
      PaperProps={{
        position: "relative",
      }}
    >
      {/*{(isLoadingParams || isLoadingNodeOrApp) && (*/}
      {/*  <Stack*/}
      {/*    width={1}*/}
      {/*    height={1}*/}
      {/*    zIndex={2}*/}
      {/*    bgcolor={"#ffffff4a"}*/}
      {/*    position={"absolute"}*/}
      {/*    alignItems={"center"}*/}
      {/*    justifyContent={"center"}*/}
      {/*  >*/}
      {/*    <CircularProgress size={50} />*/}
      {/*  </Stack>*/}
      {/*)}*/}
      {/*<FormProvider {...methods}>*/}
      <DialogContent
        sx={{
          paddingTop: "20px!important",
          paddingX: 2,
          paddingBottom: 2,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <StakeSupplierSummary
          fromAddress={fromAddress}
          chainId={chainId}
          amount={15_000}
          fee={null}
          supplierServices={[
            {
              serviceId: "service-1",
              endpoints: [
                {
                  url: "https://service-1.com",
                  rpcType: RPCType.JSON_RPC,
                  configs: [
                    {
                      key: ConfigOptions.UNKNOWN_CONFIG,
                      value: "value-1",
                    },
                  ],
                },
              ],
              revShare: [
                {
                  address: "pokt1jelx4ja2q28w626q9a0yl4wrs5asngwqch76vp",
                  revSharePercentage: 10,
                },
              ],
            },
            {
              serviceId: "service-2",
              endpoints: [
                {
                  url: "https://service-2.com",
                  rpcType: RPCType.GRPC,
                  configs: [
                    {
                      key: ConfigOptions.TIMEOUT,
                      value: "30",
                    },
                  ],
                },
              ],
              revShare: [
                {
                  address: "pokt1jelx4ja2q28w626q9a0yl4wrs5asngwqch76vp",
                  revSharePercentage: 20,
                },
              ],
            },
          ]}
        />
        {/*{status === "form"*/}
        {/*  ? form*/}
        {/*  : status === "formSecond"*/}
        {/*  ? formSecond*/}
        {/*  : status === "summary"*/}
        {/*  ? summary*/}
        {/*  : success}*/}
      </DialogContent>
      <DialogActions sx={{ padding: 0, height: 56 }}>
        <DialogButtons
          secondaryButtonProps={{
            children: "Close",
            onClick: onClose,
            // children:
            //   status === "form" || (status === "summary" && !form)
            //     ? cancelLabel
            //     : "Back",
            // onClick: onBackButtonClick,
            // sx: {
            //   display:
            //     status === "success" || hideCancelBtn ? "none" : undefined,
            // },
          }}
          primaryButtonProps={{
            children: "Ok",
            onClick: onClose,
            // children:
            //   (status === "form" && (summary || formSecond)) ||
            //   (status === "formSecond" && summary)
            //     ? nextLabel || "Next"
            //     : status === "success"
            //     ? "Done"
            //     : nextLabel || "Send",
            // type: "submit",
            // form: "transaction-form",
            // disabled: !fee || isLoadingNodeOrApp || isLoadingParams,
            // isLoading,
          }}
        />
      </DialogActions>
      {/*</FormProvider>*/}
    </BaseDialog>
  );
}
