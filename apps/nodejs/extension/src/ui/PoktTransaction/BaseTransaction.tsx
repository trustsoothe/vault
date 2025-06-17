import type { AnswerBasePoktTxResponseData } from "../../types/communications/transactions";
import Stack from "@mui/material/Stack";
import React, { useRef, useState } from "react";
import { closeSnackbar, SnackbarKey } from "notistack";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import { FormProvider, useForm } from "react-hook-form";
import CircularProgress from "@mui/material/CircularProgress";
import { selectedAccountByProtocolSelector } from "../../redux/selectors/account";
import type { AnswerTransferReq } from "../../types/communications/transfer";
import {
  DAOAction,
  PocketNetworkFee,
  PocketNetworkTransactionTypes,
  SupportedProtocols,
} from "@soothe/vault";
import { enqueueErrorSnackbar, wrongPasswordSnackbar } from "../../utils/ui";
import AppToBackground from "../../controllers/communication/AppToBackground";
import { getTransactionTypeLabel } from "../Request/PoktTransactionRequest";
import useDidMountEffect from "../hooks/useDidMountEffect";
import DialogButtons from "../components/DialogButtons";
import BaseDialog from "../components/BaseDialog";
import { useAppSelector } from "../hooks/redux";
import useGetAllParams from "./useGetAllParams";
import {
  selectedChainByProtocolSelector,
  selectedProtocolSelector,
} from "../../redux/selectors/network";

export interface PoktTransactionFormValues {
  // base
  useIsSure: boolean;
  memo?: string;
  fee?: PocketNetworkFee;
  fetchingFee?: boolean;
  chainId: string;
  txResultHash?: string;
  vaultPassword?: string;
  fromAddress: string;
  protocol: SupportedProtocols;
  // stake node, dao transfer and stake app
  amount: string;
  // stake node and app
  chains?: string[];
  // stake node
  serviceURL?: string;
  rewardDelegators?: Array<{
    address: string;
    amount: string;
    type: "added" | "adding";
  }>;
  outputAddress?: string;
  nodePublicKey?: string;
  // unstake unjail node
  nodeAddress?: string;
  // transfer app
  newAppPublicKey?: string;
  // dao transfer
  recipientAddress?: string;
  daoAction?: DAOAction;
  // change param
  paramKey?: string;
  paramValue?: string;
  overrideGovParamsWhitelistValidation?: boolean;
  // upgrade
  upgradeHeight?: string;
  upgradeVersion?: string;
  upgradeType?: "version" | "features";
  features?: Array<{
    feature: string;
    height: string;
    type: "added" | "adding";
  }>;
}

interface BaseTransactionProps {
  sendTransaction: (
    data: PoktTransactionFormValues,
    type: PocketNetworkTransactionTypes
  ) => Promise<{ data: AnswerBasePoktTxResponseData; error }>;
  defaultFormValue: Partial<PoktTransactionFormValues>;
  form?: React.ReactNode;
  formSecond?: React.ReactNode;
  summary?: React.ReactNode;
  success?: React.ReactNode;
  onClose: () => void;
  cancelLabel?: string;
  hideCancelBtn?: boolean;
  nextLabel?: string;
  request?: AnswerTransferReq["data"]["request"];
  type: PocketNetworkTransactionTypes;
  open: boolean;
}

export default function BaseTransaction({
  defaultFormValue,
  form,
  formSecond,
  summary,
  success,
  onClose,
  open,
  cancelLabel = "Cancel",
  nextLabel,
  hideCancelBtn = false,
  sendTransaction,
  type,
}: BaseTransactionProps) {
  const errorSnackbarKey = useRef<SnackbarKey>(null);
  const feeErrorSnackbarKey = useRef<SnackbarKey>(null);
  const wrongPasswordSnackbarKey = useRef<SnackbarKey>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<
    "form" | "formSecond" | "summary" | "success"
  >(form ? "form" : "summary");

  const chainId =
    useAppSelector(selectedChainByProtocolSelector)[
      SupportedProtocols.Pocket
    ] || "mainnet";
  const { isLoading: isLoadingParams } = useGetAllParams(chainId);
  const fromAddress = useAppSelector(selectedAccountByProtocolSelector)[
    SupportedProtocols.Pocket
  ];

  const selectedProtocol = useAppSelector(selectedProtocolSelector);

  const methods = useForm<PoktTransactionFormValues>({
    defaultValues: {
      useIsSure: false,
      chainId,
      amount: "",
      fromAddress,
      txResultHash: "",
      recipientAddress: "",
      protocol: SupportedProtocols.Pocket,
      nodePublicKey: null,
      newAppPublicKey: null,
      daoAction: "" as DAOAction,
      chains: [],
      serviceURL: "",
      rewardDelegators: [
        {
          address: "",
          amount: "",
          type: "adding",
        },
      ],
      outputAddress: "",
      nodeAddress: null,
      paramValue: null,
      memo: "",
      overrideGovParamsWhitelistValidation: false,
      vaultPassword: "",
      paramKey: null,
      upgradeVersion: "",
      upgradeHeight: "",
      upgradeType: "" as "version" | "features",
      features: [
        {
          feature: "",
          height: "",
          type: "adding",
        },
      ],
      ...defaultFormValue,
    },
  });

  const { getValues, reset, handleSubmit, watch, setValue, setFocus } = methods;

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

  const isLoadingNodeOrApp = useAppSelector((state) => {
    return (
      Object.entries(state?.poktApi?.queries || {}).some(([key, value]) => {
        return (
          (key.startsWith("getNode") || key.startsWith("getApp")) &&
          value.status === "pending"
        );
      }) || false
    );
  });

  useDidMountEffect(() => {
    if (open) {
      onClose();
    }
  }, [chainId, fromAddress, selectedProtocol]);

  const getFee = () => {
    if (!getValues("fee")) {
      setValue("fetchingFee", true);
    }

    console.log('debug: calling network fee');

    AppToBackground.getNetworkFee({
      chainId,
      protocol: SupportedProtocols.Pocket,
    })
      .then((res) => {
        if (res.error) {
          feeErrorSnackbarKey.current = enqueueErrorSnackbar({
            message: {
              title: "Failed to fetch Fee",
              content: "There was an error trying to fetch the Fee.",
            },
            persist: true,
            onRetry: getFee,
          });
        } else {
          closeSnackbars();
          setValue("fee", res.data.networkFee as PocketNetworkFee);
        }
      })
      .finally(() => setValue("fetchingFee", false));
  };

  useDidMountEffect(() => {
    const values: PoktTransactionFormValues = {
      useIsSure: false,
      chainId,
      amount: "",
      fromAddress,
      txResultHash: "",
      recipientAddress: "",
      protocol: SupportedProtocols.Pocket,
      nodePublicKey: null,
      newAppPublicKey: null,
      daoAction: "" as DAOAction,
      chains: [],
      serviceURL: "",
      rewardDelegators: [
        {
          address: "",
          amount: "",
          type: "adding",
        },
      ],
      outputAddress: "",
      nodeAddress: null,
      paramValue: "",
      memo: "",
      overrideGovParamsWhitelistValidation: false,
      vaultPassword: "",
      paramKey: null,
      features: [
        {
          feature: "",
          height: "",
          type: "adding",
        },
      ],
      upgradeType: "" as "version" | "features",
      upgradeHeight: "",
      upgradeVersion: "",
      ...defaultFormValue,
    };

    if (open) {
      reset(values);
      setStatus(form ? "form" : "summary");
      getFee();
    } else {
      setTimeout(() => {
        reset({ ...values });
        setStatus(form ? "form" : "summary");
      }, 150);
    }

    closeSnackbars();

    return closeSnackbars;
  }, [open]);

  const [fee, vaultPassword] = watch(["fee", "vaultPassword"]);

  useDidMountEffect(() => {
    if (vaultPassword && wrongPasswordSnackbarKey.current) {
      closeSnackbar(wrongPasswordSnackbarKey.current);
      wrongPasswordSnackbarKey.current = null;
    }
  }, [vaultPassword]);

  const onSubmit = async (data: PoktTransactionFormValues) => {
    if (status === "form" && formSecond) {
      setStatus("formSecond");
      return;
    }

    if ((status === "formSecond" || status === "form") && summary) {
      setStatus("summary");
      return;
    }

    if (status === "success") {
      onClose();
      return;
    }

    setIsLoading(true);

    sendTransaction(data, type)
      .then((res) => {
        if (res.error) {
          errorSnackbarKey.current = enqueueErrorSnackbar({
            variant: "error",
            message: {
              title: "Failed to answer the request",
              content: `There was an error trying to send the transaction.`,
            },
            onRetry: () => onSubmit(data),
          });
        } else {
          if (res.data.isPasswordWrong) {
            wrongPasswordSnackbarKey.current = wrongPasswordSnackbar();
            setValue("vaultPassword", "");
            setTimeout(() => setFocus("vaultPassword"), 0);
          } else {
            setValue("txResultHash", res.data.hash);
            setStatus("success");
            closeSnackbars();
          }
        }
      })
      .catch(() => {
        errorSnackbarKey.current = enqueueErrorSnackbar({
          variant: "error",
          message: {
            title: "Failed to answer the request",
            content: `There was an error trying to send the transaction.`,
          },
          onRetry: () => onSubmit(data),
        });
      })
      .finally(() => setIsLoading(false));
  };

  const onBackButtonClick = () => {
    if (status === "form" || (status === "summary" && !form)) {
      onClose();
    } else if (status === "summary" && form) {
      setStatus(formSecond ? "formSecond" : "form");
    } else if (status === "formSecond") {
      setStatus("form");
    }
  };

  return (
    <BaseDialog
      open={open}
      onClose={onClose}
      title={type ? getTransactionTypeLabel(type) : ""}
      component={"form"}
      id={"transaction-form"}
      onSubmit={handleSubmit(onSubmit)}
      PaperProps={{
        position: "relative",
      }}
    >
      {(isLoadingParams || isLoadingNodeOrApp) && (
        <Stack
          width={1}
          height={1}
          zIndex={2}
          bgcolor={"#ffffff4a"}
          position={"absolute"}
          alignItems={"center"}
          justifyContent={"center"}
        >
          <CircularProgress size={50} />
        </Stack>
      )}
      <FormProvider {...methods}>
        <DialogContent
          sx={{
            paddingTop: "20px!important",
            paddingX: 2,
            paddingBottom: 2,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {status === "form"
            ? form
            : status === "formSecond"
            ? formSecond
            : status === "summary"
            ? summary
            : success}
        </DialogContent>
        <DialogActions sx={{ padding: 0, height: 56 }}>
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
                (status === "form" && (summary || formSecond)) ||
                (status === "formSecond" && summary)
                  ? nextLabel || "Next"
                  : status === "success"
                  ? "Done"
                  : nextLabel || "Send",
              type: "submit",
              form: "transaction-form",
              disabled: !fee || isLoadingNodeOrApp || isLoadingParams,
              isLoading,
            }}
          />
        </DialogActions>
      </FormProvider>
    </BaseDialog>
  );
}
