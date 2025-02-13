import type { AnswerTransferReq } from "../../types/communications/transfer";
import type { SendTransactionParams } from "../../redux/slices/vault/account";
import { closeSnackbar, SnackbarKey } from "notistack";
import DialogActions from "@mui/material/DialogActions";
import { FormProvider, useForm } from "react-hook-form";
import React, { useEffect, useRef, useState } from "react";
import {
  EthereumNetworkFee,
  EthereumNetworkFeeRequestOptions,
  PocketNetworkFee,
  CosmosFee,
  SupportedProtocols,
} from "@soothe/vault";
import { enqueueErrorSnackbar, wrongPasswordSnackbar } from "../../utils/ui";
import AppToBackground from "../../controllers/communication/AppToBackground";
import { isValidAddress } from "../../utils/networkOperations";
import useDidMountEffect from "../hooks/useDidMountEffect";
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
  fee?: PocketNetworkFee | EthereumNetworkFee | CosmosFee;
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
  hideCancelBtn?: boolean;
  nextLabel?: string;
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
  nextLabel,
  request,
  hideCancelBtn = false,
}: BaseTransactionProps) {
  const errorSnackbarKey = useRef<SnackbarKey>(null);
  const feeErrorSnackbarKey = useRef<SnackbarKey>(null);
  const wrongPasswordSnackbarKey = useRef<SnackbarKey>(null);
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
  const { getValues, reset, handleSubmit, watch, setValue } = methods;

  const closeSnackbars = () => {
    if (feeErrorSnackbarKey.current) {
      closeSnackbar(feeErrorSnackbarKey.current);
      feeErrorSnackbarKey.current = null;
    }

    if (errorSnackbarKey.current) {
      closeSnackbar(errorSnackbarKey.current);
      errorSnackbarKey.current = null;
    }

    if (wrongPasswordSnackbarKey.current) {
      closeSnackbar(wrongPasswordSnackbarKey.current);
      wrongPasswordSnackbarKey.current = null;
    }
  };

  useDidMountEffect(() => {
    reset({
      chainId,
      protocol,
      amount: "",
      fromAddress,
      txResultHash: "",
      recipientAddress: "",
      ...defaultFormValue,
      txSpeed: defaultFormValue?.txSpeed,
    });

    setStatus(form ? "form" : "summary");
    closeSnackbars();

    return closeSnackbars;
  }, [protocol, chainId, fromAddress]);

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
          feeErrorSnackbarKey.current = enqueueErrorSnackbar({
            message: {
              title: "Failed to fetch Fee",
              content: "There was an error trying to fetch the Fee.",
            },
            onRetry: getFee,
          });
        } else {
          closeSnackbars();
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
        errorSnackbarKey.current = enqueueErrorSnackbar({
          message: "Transaction Failed",
          onRetry: () => onSubmit(data),
        });
      } else {
        if (response?.data?.isPasswordWrong) {
          wrongPasswordSnackbarKey.current = wrongPasswordSnackbar();
        } else {
          closeSnackbars();
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
              display:
                status === "success" || hideCancelBtn ? "none" : undefined,
            },
          }}
          primaryButtonProps={{
            children:
              status === "form" && summary
                ? nextLabel || "Next"
                : status === "success"
                ? "Done"
                : nextLabel || "Send",
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
