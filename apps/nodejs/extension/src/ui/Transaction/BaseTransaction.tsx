import type { SendTransactionParams } from "../../redux/slices/vault/account";
import React, { useEffect, useState } from "react";
import DialogActions from "@mui/material/DialogActions";
import { FormProvider, useForm } from "react-hook-form";
import {
  EthereumNetworkFee,
  EthereumNetworkFeeRequestOptions,
  PocketNetworkFee,
  SupportedProtocols,
} from "@poktscan/vault";
import AppToBackground from "../../controllers/communication/AppToBackground";
import { isValidAddress } from "../../utils/networkOperations";
import DialogButtons from "../components/DialogButtons";
import { enqueueErrorSnackbar } from "../../utils/ui";

export interface TransactionFormValues {
  amount: string;
  chainId: string;
  fromAddress: string;
  txResultHash?: string;
  vaultPassword?: string;
  recipientAddress?: string;
  protocol: SupportedProtocols;
  recipientProtocol?: SupportedProtocols;
  txSpeed?: "medium" | "low" | "high" | "site";
  fee?: PocketNetworkFee | EthereumNetworkFee;
  fetchingFee?: boolean;
}

interface BaseTransactionProps {
  protocol: SupportedProtocols;
  chainId: string;
  fromAddress: string;
  asset?: {
    contractAddress: string;
    decimals: number;
  };
  feeOptions?: EthereumNetworkFeeRequestOptions;
  getTransaction: (data: TransactionFormValues) => SendTransactionParams;
  defaultFormValue: Partial<TransactionFormValues>;
  form?: React.ReactNode;
  summary?: React.ReactNode;
  success?: React.ReactNode;
}

export default function BaseTransaction({
  fromAddress,
  chainId,
  protocol,
  asset,
  feeOptions,
  defaultFormValue,
  form,
  summary,
  getTransaction,
  success,
}: BaseTransactionProps) {
  const [status, setStatus] = useState<"form" | "summary" | "success">(
    form ? "form" : "summary"
  );

  const methods = useForm<TransactionFormValues>({
    defaultValues: {
      chainId,
      protocol,
      amount: "",
      fromAddress,
      txResultHash: "",
      recipientAddress: "",
      ...defaultFormValue,
    },
  });
  const { getValues, handleSubmit, watch, setValue } = methods;

  const getFee = () => {
    if (
      protocol === SupportedProtocols.Ethereum &&
      !isValidAddress(feeOptions?.to || getValues("recipientAddress"), protocol)
    ) {
      setValue("fee", null);
      return;
    }

    if (!getValues("fee")) {
      setValue("fetchingFee", true);
    }

    AppToBackground.getNetworkFee({
      chainId,
      protocol,
      ...(protocol === SupportedProtocols.Ethereum && {
        from: fromAddress,
        data: feeOptions?.data,
        gasLimit: feeOptions?.gasLimit,
        maxFeePerGas: feeOptions?.maxFeePerGas,
        toAddress: feeOptions?.to || getValues("recipientAddress"),
        maxPriorityFeePerGas: feeOptions?.maxPriorityFeePerGas,
        // @ts-ignore todo: change asset type of getNetworkFee
        asset: asset ? { ...asset, protocol, chainID: chainId } : undefined,
      }),
    })
      .then((res) => {
        if (res.error) {
          enqueueErrorSnackbar({
            message: "Failed to fetch Fee",
            onRetry: getFee,
            persist: true,
          });
        } else {
          setValue("fee", res.data.networkFee);
        }
      })
      .finally(() => setValue("fetchingFee", false));
  };

  const [recipientAddress] = watch(["recipientAddress"]);

  useEffect(() => {
    getFee();

    if (protocol === SupportedProtocols.Ethereum) {
      const interval = setInterval(getFee, 30000);

      return () => clearInterval(interval);
    }
  }, [
    protocol,
    chainId,
    feeOptions,
    protocol === SupportedProtocols.Ethereum ? recipientAddress : null,
  ]);

  const onSubmit = async (data: TransactionFormValues) => {
    if (status === "form" && summary) {
      setStatus("summary");
      return;
    }

    const transaction = getTransaction(data);

    const response = await AppToBackground.sendRequestToAnswerTransfer({
      transferData: transaction,
    });

    if (response.error) {
      enqueueErrorSnackbar({
        message: "Transaction Failed",
        onRetry: () => onSubmit(data),
      });
    } else {
      if (response?.data?.isPasswordWrong) {
      } else {
        if (success) {
          setValue("txResultHash", response.data.hash);

          setStatus("success");
        }
      }
    }
  };

  return (
    <FormProvider {...methods}>
      <form id={"transaction-form"} onSubmit={handleSubmit(onSubmit)}>
        {status === "form" ? form : status === "summary" ? summary : success}
      </form>
      <DialogActions sx={{ height: 85, padding: 0 }}>
        <DialogButtons
          secondaryButtonProps={{
            children: "Back",
          }}
          primaryButtonProps={{
            children: status === "form" && summary ? "Next" : "Send",
            type: "submit",
            form: "transaction-form",
          }}
        />
      </DialogActions>
    </FormProvider>
  );
}
