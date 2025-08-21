import type { ReportBugMetadata } from "../ReportBug/ReportBug";
import type { AnswerTransferReq } from "../../types/communications/transfer";
import type { SendTransactionParams } from "../../redux/slices/vault/account";
import { closeSnackbar, SnackbarKey } from "notistack";
import DialogActions from "@mui/material/DialogActions";
import { FormProvider, useForm } from "react-hook-form";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CosmosFee,
  EthereumNetworkFee,
  EthereumNetworkFeeRequestOptions,
  PocketNetworkFee,
  SupportedProtocols,
} from "@soothe/vault";
import {
  enqueueErrorReportSnackbar,
  enqueueErrorSnackbar,
  wrongPasswordSnackbar,
} from "../../utils/ui";
import AppToBackground from "../../controllers/communication/AppToBackground";
import { isValidAddress } from "../../utils/networkOperations";
import useDidMountEffect from "../hooks/useDidMountEffect";
import DialogButtons from "../components/DialogButtons";
import { useAppSelector } from "../hooks/redux";
import { REPORT_BUG_PAGE } from "../../constants/routes";
import { accountsSelector } from "../../redux/selectors/account";
import { CosmosFeeRequestOption } from "@soothe/vault/dist/lib/core/common/protocols/Cosmos/CosmosFeeRequestOption";
import { TransactionStatus } from "../../controllers/datasource/Transaction";
import debounce from "lodash/debounce";
import { getUnknownErrorWithOriginal } from "../../errors/communication";

export function getTransactionFailedMessage(
  error: ReturnType<typeof getUnknownErrorWithOriginal>
) {
  const originalError = error.originalError as Error;
  if (
    originalError?.message?.toLowerCase()?.includes("network") ||
    originalError?.name?.toLowerCase()?.includes("network")
  ) {
    return "There was en error sending your transaction.";
  }

  return "There was an error building your transaction.";
}

export interface TransactionFormValues {
  memo?: string;
  amount: string;
  chainId: string;
  fromAddress: string;
  txResponse?: {
    hash: string;
    status: TransactionStatus;
    details?: object;
  };
  vaultPassword?: string;
  recipientAddress?: string;
  protocol: SupportedProtocols;
  recipientProtocol?: SupportedProtocols;
  txSpeed?: "medium" | "low" | "high" | "site";
  fee?: PocketNetworkFee | EthereumNetworkFee | CosmosFee;
  fetchingFee?: boolean;
  pocketGasAuto: boolean;
  pocketGasInput: number;
  pocketGasPrice: number;
  pocketFeePreset?: string;
  pocketGasAdjustment: number;
}

interface BaseTransactionProps {
  protocol: SupportedProtocols;
  chainId: string;
  fromAddress: string;
  getFeeOptions?: (
    data: TransactionFormValues
  ) => Partial<EthereumNetworkFeeRequestOptions | CosmosFeeRequestOption>;
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

  const accounts = useAppSelector(accountsSelector);
  const navigate = useNavigate();
  const methods = useForm<TransactionFormValues>({
    defaultValues: {
      chainId,
      protocol,
      amount: "",
      fromAddress,
      txResponse: null,
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
      txResponse: null,
      recipientAddress: "",
      ...defaultFormValue,
      txSpeed: defaultFormValue?.txSpeed,
    });

    setStatus(form ? "form" : "summary");
    closeSnackbars();

    return closeSnackbars;
  }, [protocol, chainId, fromAddress]);

  const getFee = () => {
    let feeOptions: Partial<
      EthereumNetworkFeeRequestOptions | CosmosFeeRequestOption
    >;

    if (getFeeOptions) {
      feeOptions = getFeeOptions(getValues());
    }

    const ethereumOptions =
      feeOptions?.protocol === SupportedProtocols.Ethereum &&
      (feeOptions as EthereumNetworkFeeRequestOptions);
    const cosmosOptions =
      feeOptions?.protocol === SupportedProtocols.Cosmos &&
      (feeOptions as CosmosFeeRequestOption);

    if (
      protocol === SupportedProtocols.Ethereum &&
      !isValidAddress(
        ethereumOptions?.to || getValues("recipientAddress"),
        protocol
      )
    ) {
      setValue("fee", null);
      return;
    }

    if (
      protocol === SupportedProtocols.Cosmos &&
      !isValidAddress(
        cosmosOptions?.transaction.to || getValues("recipientAddress"),
        protocol
      )
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
        data: ethereumOptions?.data,
        gasLimit: ethereumOptions?.gasLimit,
        maxFeePerGas: ethereumOptions?.maxFeePerGas,
        toAddress: ethereumOptions?.to || getValues("recipientAddress"),
        maxPriorityFeePerGas: ethereumOptions?.maxPriorityFeePerGas,
        // @ts-ignore todo: change asset type of getNetworkFee
        asset: feeOptions?.asset
          ? {
              contractAddress: ethereumOptions.asset.contractAddress,
              decimals: ethereumOptions.asset.decimals,
              protocol,
              // @ts-ignore
              chainID: chainId,
            }
          : undefined,
      }),
      ...(protocol === SupportedProtocols.Cosmos && {
        from: fromAddress,
        toAddress:
          cosmosOptions?.transaction.to || getValues("recipientAddress"),
        pocketGasUsed: cosmosOptions.transaction.gas,
        pocketGasPrice: cosmosOptions.transaction.gasPrice,
        pocketGasAdjustment: cosmosOptions.transaction.gasAdjustment,
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

  const debouncedGetFee = useCallback(
    debounce(() => {
      getFee();
    }, 500),
    []
  );

  const [
    recipientAddress,
    fee,
    pocketGasAuto,
    pocketGasInput,
    pocketGasPrice,
    pocketGasAdjustment,
  ] = watch([
    "recipientAddress",
    "fee",
    "pocketGasAuto",
    "pocketGasInput",
    "pocketGasPrice",
    "pocketGasAdjustment",
  ]);

  useEffect(() => {
    if (status === "success") return;

    debouncedGetFee();

    let interval: NodeJS.Timeout | null = null;
    if (
      [SupportedProtocols.Ethereum, SupportedProtocols.Cosmos].includes(
        protocol
      )
    ) {
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
    pocketGasAuto,
    pocketGasInput,
    pocketGasPrice,
    pocketGasAdjustment,
    debouncedGetFee,
    [SupportedProtocols.Ethereum, SupportedProtocols.Cosmos].includes(protocol)
      ? recipientAddress
      : null,
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
        errorSnackbarKey.current = enqueueErrorReportSnackbar({
          message: {
            title: "Transaction Failed",
            content: getTransactionFailedMessage(
              response.error as ReturnType<typeof getUnknownErrorWithOriginal>
            ),
          },
          persist: true,
          onRetry: () => onSubmit(data),
          onReport: () => {
            const account = accounts.find(
              (account) => account.id === transaction.from.value
            );

            const tx = {
              ...transaction,
            };

            delete tx.from.passphrase;

            if (tx.from.type === "RawPrivateKey") {
              delete tx.from.value;
            }

            const bugMetadata: ReportBugMetadata = {
              address: account?.address,
              publicKey: account?.publicKey,
              protocol: transaction.network.protocol,
              chainId: transaction.network.chainID,
              transactionType: "Send",
              error: response.error,
              transactionData: tx,
            };

            navigate(REPORT_BUG_PAGE, {
              state: bugMetadata,
            });
          },
        });
      } else {
        if (response?.data?.isPasswordWrong) {
          wrongPasswordSnackbarKey.current = wrongPasswordSnackbar();
        } else {
          closeSnackbars();
          if (success) {
            setValue("txResponse", {
              hash: response.data.hash,
              details: response.data.details,
              status: response.data.status,
            });

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
      <DialogActions sx={{ height: 56, padding: 0 }}>
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
