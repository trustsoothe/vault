import type { AnswerTransferReq } from "../../types/communications/transfer";
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
import { enqueueErrorSnackbar, wrongPasswordSnackbar } from "../../utils/ui";
import AppToBackground from "../../controllers/communication/AppToBackground";
import { isValidAddress } from "../../utils/networkOperations";
import DialogButtons from "../components/DialogButtons";

export interface TransactionFormValues {
  memo?: string;
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
  getFeeOptions?: (
    data: TransactionFormValues
  ) => Partial<EthereumNetworkFeeRequestOptions>;
  getTransaction: (data: TransactionFormValues) => SendTransactionParams;
  defaultFormValue: Partial<TransactionFormValues>;
  form?: React.ReactNode;
  summary?: React.ReactNode;
  success?: React.ReactNode;
  onCancel: () => void;
  onDone?: () => void;
  cancelLabel?: string;

  request?: AnswerTransferReq["data"]["request"];
}

export default function BaseTransaction({
  fromAddress,
  chainId,
  protocol,
  getFeeOptions,
  defaultFormValue,
  form,
  summary,
  getTransaction,
  success,
  onCancel,
  onDone,
  cancelLabel = "Cancel",
  request,
}: BaseTransactionProps) {
  const [isLoading, setIsLoading] = useState(false);
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
    let feeOptions: Partial<EthereumNetworkFeeRequestOptions>;

    if (getFeeOptions) {
      feeOptions = getFeeOptions(getValues());
    }

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
        asset: feeOptions?.asset
          ? {
              contractAddress: feeOptions.asset.contractAddress,
              decimals: feeOptions.asset.decimals,
              protocol,
              // @ts-ignore
              chainID: chainId,
            }
          : undefined,
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

  const [recipientAddress, fee] = watch(["recipientAddress", "fee"]);

  useEffect(() => {
    if (status === "success") return;

    getFee();
    let interval: NodeJS.Timeout | null = null;
    if (protocol === SupportedProtocols.Ethereum) {
      interval = setInterval(getFee, 30000);
    }
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [
    status,
    protocol,
    chainId,
    protocol === SupportedProtocols.Ethereum ? recipientAddress : null,
  ]);

  const onSubmit = async (data: TransactionFormValues) => {
    if (status === "form" && summary) {
      setStatus("summary");
      return;
    }

    if (status === "success") {
      if (onDone) onDone();
      return;
    }

    setIsLoading(true);

    try {
      const transaction = getTransaction(data);

      const response = await AppToBackground.sendRequestToAnswerTransfer({
        transferData: transaction,
        request,
      });

      if (response.error) {
        enqueueErrorSnackbar({
          message: "Transaction Failed",
          onRetry: () => onSubmit(data),
        });
      } else {
        if (response?.data?.isPasswordWrong) {
          wrongPasswordSnackbar();
        } else {
          if (success) {
            setValue("txResultHash", response.data.hash);

            setStatus("success");
          }
        }
      }
    } catch (e) {}

    setIsLoading(false);
  };

  const onBackButtonClick = () => {
    if (status === "form" || (status === "summary" && !form)) {
      onCancel();
    } else if (status === "summary" && form) {
      setStatus("form");
    }
  };

  return (
    <FormProvider {...methods}>
      <form
        id={"transaction-form"}
        onSubmit={handleSubmit(onSubmit)}
        style={{ overflowY: "auto", height: "100%" }}
      >
        {status === "form" ? form : status === "summary" ? summary : success}
      </form>
      <DialogActions sx={{ height: 85, padding: 0 }}>
        <DialogButtons
          secondaryButtonProps={{
            children:
              status === "form" || (status === "summary" && !form)
                ? cancelLabel
                : "Back",
            onClick: onBackButtonClick,
            sx: {
              display: status === "success" ? "none" : undefined,
            },
          }}
          primaryButtonProps={{
            children:
              status === "form" && summary
                ? "Next"
                : status === "success"
                ? "Done"
                : "Send",
            type: "submit",
            form: "transaction-form",
            disabled: !fee,
            isLoading,
          }}
        />
      </DialogActions>
    </FormProvider>
  );
}
