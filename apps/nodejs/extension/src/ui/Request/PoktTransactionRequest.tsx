import type { PoktTxRequest } from "../../types/communications/transactions";
import Stack from "@mui/material/Stack";
import { useLocation } from "react-router-dom";
import Typography from "@mui/material/Typography";
import { closeSnackbar, SnackbarKey } from "notistack";
import { FormProvider, useForm } from "react-hook-form";
import React, { useEffect, useRef, useState } from "react";
import { enqueueErrorSnackbar, wrongPasswordSnackbar } from "../../utils/ui";
import {
  PocketNetworkFee,
  PocketNetworkTransactionTypes,
  SupportedProtocols,
  ValidateTransactionResult,
} from "@soothe/vault";
import AppToBackground from "../../controllers/communication/AppToBackground";
import DialogButtons from "../components/DialogButtons";
import { WIDTH } from "../../constants/ui";
import RequestInfo from "./RequestInfo";
import { themeColors } from "../theme";
import {
  CHANGE_PARAM_REQUEST,
  DAO_TRANSFER_REQUEST,
  STAKE_APP_REQUEST,
  STAKE_NODE_REQUEST,
  TRANSFER_APP_REQUEST,
  UNJAIL_NODE_REQUEST,
  UNSTAKE_APP_REQUEST,
  UNSTAKE_NODE_REQUEST,
  UPGRADE_REQUEST,
} from "../../constants/communication";
import UpgradeSummary from "../PoktTransaction/Upgrade/Summary";
import StakeAppSummary from "../PoktTransaction/StakeApp/Summary";
import UnstakeApp from "../PoktTransaction/UnstakeApp/SummaryForm";
import StakeNodeSummary from "../PoktTransaction/StakeNode/Summary";
import TransferAppSummary from "../PoktTransaction/TransferApp/Summary";
import ChangeParamSummary from "../PoktTransaction/ChangeParam/Summary";
import DaoTransferSummary from "../PoktTransaction/DaoTransfer/Summary";
import UnstakeUnjailNodeSummary from "../PoktTransaction/UnstakeUnjailNode/Summary";

export function getTransactionFn(transactionRequest: PoktTxRequest) {
  let fn:
    | typeof AppToBackground.stakeNode
    | typeof AppToBackground.unstakeNode
    | typeof AppToBackground.unjailNode
    | typeof AppToBackground.stakeApp
    | typeof AppToBackground.transferApp
    | typeof AppToBackground.unstakeApp
    | typeof AppToBackground.changeParam
    | typeof AppToBackground.daoTransfer
    | typeof AppToBackground.upgrade;

  switch (transactionRequest.type) {
    case STAKE_NODE_REQUEST:
      fn = AppToBackground.stakeNode;
      break;
    case UNSTAKE_NODE_REQUEST:
      fn = AppToBackground.unstakeNode;
      break;
    case UNJAIL_NODE_REQUEST:
      fn = AppToBackground.unjailNode;
      break;
    case STAKE_APP_REQUEST:
      fn = AppToBackground.stakeApp;
      break;
    case TRANSFER_APP_REQUEST:
      fn = AppToBackground.transferApp;
      break;
    case UNSTAKE_APP_REQUEST:
      fn = AppToBackground.unstakeApp;
      break;
    case CHANGE_PARAM_REQUEST:
      fn = AppToBackground.changeParam;
      break;
    case DAO_TRANSFER_REQUEST:
      fn = AppToBackground.daoTransfer;
      break;
    case UPGRADE_REQUEST:
      fn = AppToBackground.upgrade;
      break;
    default:
      throw new Error("Invalid transaction request");
  }
  return fn;
}

export function getTransactionTypeLabel(type: PocketNetworkTransactionTypes) {
  switch (type) {
    case PocketNetworkTransactionTypes.NodeStake:
      return "Stake Node";
    case PocketNetworkTransactionTypes.NodeUnstake:
      return "Unstake Node";
    case PocketNetworkTransactionTypes.NodeUnjail:
      return "Unjail Node";
    case PocketNetworkTransactionTypes.AppStake:
      return "Stake App";
    case PocketNetworkTransactionTypes.AppTransfer:
      return "Transfer App";
    case PocketNetworkTransactionTypes.AppUnstake:
      return "Unstake App";
    case PocketNetworkTransactionTypes.GovChangeParam:
      return "Change Param";
    case PocketNetworkTransactionTypes.GovDAOTransfer:
      return "DAO Transfer";
    case PocketNetworkTransactionTypes.GovUpgrade:
      return "Upgrade";
    case PocketNetworkTransactionTypes.Send:
      return "Send";
    default:
      throw new Error("Invalid transaction request type: " + type);
  }
}

function getTransactionType(transactionRequest: PoktTxRequest) {
  switch (transactionRequest.type) {
    case STAKE_NODE_REQUEST:
      return PocketNetworkTransactionTypes.NodeStake;
    case UNSTAKE_NODE_REQUEST:
      return PocketNetworkTransactionTypes.NodeUnstake;
    case UNJAIL_NODE_REQUEST:
      return PocketNetworkTransactionTypes.NodeUnjail;
    case STAKE_APP_REQUEST:
      return PocketNetworkTransactionTypes.AppStake;
    case TRANSFER_APP_REQUEST:
      return PocketNetworkTransactionTypes.AppTransfer;
    case UNSTAKE_APP_REQUEST:
      return PocketNetworkTransactionTypes.AppUnstake;
    case CHANGE_PARAM_REQUEST:
      return PocketNetworkTransactionTypes.GovChangeParam;
    case DAO_TRANSFER_REQUEST:
      return PocketNetworkTransactionTypes.GovDAOTransfer;
    case UPGRADE_REQUEST:
      return PocketNetworkTransactionTypes.GovUpgrade;
    default:
      throw new Error("Invalid transaction request");
  }
}

interface PoktTxForm {
  fee?: PocketNetworkFee;
  fetchingFee?: boolean;
  vaultPassword?: string;
  amount?: string;
}

export default function PoktTransactionRequest() {
  const errorSnackbarKey = useRef<SnackbarKey>();
  const feeErrorSnackbarKey = useRef<SnackbarKey>(null);
  const wrongPasswordSnackbarKey = useRef<SnackbarKey>(null);
  const validationErrorSnackbarKey = useRef<SnackbarKey>(null);
  const [isLoading, setIsLoading] = useState(false);
  const location = useLocation();
  const transactionRequest: PoktTxRequest = location.state;
  const [validation, setValidation] = useState<{
    loading: boolean;
    result: ValidateTransactionResult;
  }>({
    loading: true,
    result: null,
  });

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

  const methods = useForm<PoktTxForm>({
    defaultValues: {
      vaultPassword: "",
      fetchingFee: true,
    },
  });
  const { getValues, handleSubmit, watch, setValue } = methods;

  const [fee, fetchingFee] = watch(["fee", "fetchingFee"]);

  // todo: add RTK query
  const getFee = () => {
    if (!getValues("fee")) {
      setValue("fetchingFee", true);
    }

    AppToBackground.getNetworkFee({
      chainId: transactionRequest.transactionData.chainId,
      protocol: SupportedProtocols.Pocket,
    })
      .then((res) => {
        if (res.error) {
          feeErrorSnackbarKey.current = enqueueErrorSnackbar({
            message: "Failed to fetch Fee",
            onRetry: getFee,
          });
        } else {
          closeSnackbars();
          setValue("fee", res.data.networkFee as PocketNetworkFee);
        }
      })
      .finally(() => setValue("fetchingFee", false));
  };

  const getValidation = () => {
    if (validation.result) return;

    setValidation({
      loading: true,
      result: null,
    });

    AppToBackground.validatePoktTx({
      request: transactionRequest,
    }).then((res) => {
      if (res.error) {
        validationErrorSnackbarKey.current = enqueueErrorSnackbar({
          variant: "error",
          message: {
            title: "Failed to validate the transaction",
            content: `There was an error trying to validate the transaction.`,
          },
          persist: true,
          onRetry: getValidation,
        });
      } else {
        if (validationErrorSnackbarKey.current) {
          closeSnackbar(validationErrorSnackbarKey.current);
        }

        setValidation({
          loading: false,
          result: res.data.result,
        });
      }
    });
  };

  useEffect(() => {
    getFee();

    return closeSnackbars;
  }, []);

  const rejectRequest = () => {
    setIsLoading(true);
    getTransactionFn(transactionRequest)({
      request: transactionRequest,
      rejected: true,
      fee: 0,
      vaultPassword: "",
      transactionData: null,
    })
      .then((res) => {
        if (res.error) {
          errorSnackbarKey.current = enqueueErrorSnackbar({
            variant: "error",
            message: {
              title: "Failed to answer the request",
              content: `There was an error trying to reject the request.`,
            },
            onRetry: rejectRequest,
          });
        } else {
          closeSnackbars();
        }
      })
      .catch(() => {
        errorSnackbarKey.current = enqueueErrorSnackbar({
          variant: "error",
          message: {
            title: "Failed to answer the request",
            content: `There was an error trying to reject the request.`,
          },
          onRetry: rejectRequest,
        });
      })
      .finally(() => setIsLoading(false));
  };

  const onSubmit = (data: PoktTxForm) => {
    setIsLoading(true);

    getTransactionFn(transactionRequest)({
      transactionData: transactionRequest.transactionData,
      vaultPassword: data.vaultPassword,
      request: transactionRequest,
      rejected: false,
      fee: data.fee?.value || 0.01,
    })
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
          } else {
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

  let summaryComponent;

  switch (transactionRequest.type) {
    case STAKE_NODE_REQUEST: {
      summaryComponent = (
        <StakeNodeSummary
          fromAddress={transactionRequest.transactionData.address}
          chainId={transactionRequest.transactionData.chainId}
          amount={Number(transactionRequest.transactionData.amount) / 1e6}
          chains={transactionRequest.transactionData.chains}
          serviceURL={transactionRequest.transactionData.serviceURL}
          fee={{
            fee,
            fetchingFee,
          }}
          nodeAddress={transactionRequest.transactionData.nodeAddress}
          outputAddress={transactionRequest.transactionData.outputAddress}
          memo={transactionRequest.transactionData.memo}
          rewardDelegators={transactionRequest.transactionData.rewardDelegators}
        />
      );
      break;
    }
    case UNJAIL_NODE_REQUEST:
    case UNSTAKE_NODE_REQUEST: {
      summaryComponent = (
        <UnstakeUnjailNodeSummary
          signerAddress={transactionRequest.transactionData.address}
          nodeAddress={transactionRequest.transactionData.nodeAddress}
          chainId={transactionRequest.transactionData.chainId}
          fee={{
            fee,
            fetchingFee,
          }}
        />
      );
      break;
    }
    case STAKE_APP_REQUEST: {
      summaryComponent = (
        <StakeAppSummary
          appAddress={transactionRequest.transactionData.address}
          chainId={transactionRequest.transactionData.chainId}
          amount={Number(transactionRequest.transactionData.amount) / 1e6}
          chains={transactionRequest.transactionData.chains}
          fee={{
            fee,
            fetchingFee,
          }}
          memo={transactionRequest.transactionData.memo}
        />
      );
      break;
    }
    case TRANSFER_APP_REQUEST: {
      summaryComponent = (
        <TransferAppSummary
          appAddress={transactionRequest.transactionData.address}
          chainId={transactionRequest.transactionData.chainId}
          fee={{
            fee,
            fetchingFee,
          }}
          memo={transactionRequest.transactionData.memo}
          newAppPublicKey={transactionRequest.transactionData.newAppPublicKey}
        />
      );
      break;
    }
    case UNSTAKE_APP_REQUEST: {
      summaryComponent = (
        <UnstakeApp
          fromAddress={transactionRequest.transactionData.address}
          chainId={transactionRequest.transactionData.chainId}
          fee={{
            fee,
            fetchingFee,
          }}
          memo={transactionRequest.transactionData.memo}
          canEditMemo={false}
          addTitle={false}
        />
      );
      break;
    }
    case CHANGE_PARAM_REQUEST: {
      summaryComponent = (
        <ChangeParamSummary
          fromAddress={transactionRequest.transactionData.address}
          chainId={transactionRequest.transactionData.chainId}
          fee={{
            fee,
            fetchingFee,
          }}
          memo={transactionRequest.transactionData.memo}
          paramKey={transactionRequest.transactionData.paramKey}
          paramValue={transactionRequest.transactionData.paramValue}
          overrideGovParamsWhitelistValidation={
            transactionRequest.transactionData
              .overrideGovParamsWhitelistValidation
          }
        />
      );
      break;
    }
    case DAO_TRANSFER_REQUEST: {
      summaryComponent = (
        <DaoTransferSummary
          fromAddress={transactionRequest.transactionData.address}
          chainId={transactionRequest.transactionData.chainId}
          fee={{
            fee,
            fetchingFee,
          }}
          memo={transactionRequest.transactionData.memo}
          daoAction={transactionRequest.transactionData.daoAction}
          amount={Number(transactionRequest.transactionData.amount) / 1e6}
          to={transactionRequest.transactionData.to}
        />
      );
      break;
    }
    case UPGRADE_REQUEST: {
      summaryComponent = (
        <UpgradeSummary
          fromAddress={transactionRequest.transactionData.address}
          chainId={transactionRequest.transactionData.chainId}
          fee={{
            fee,
            fetchingFee,
          }}
          memo={transactionRequest.transactionData.memo}
          upgradeHeight={transactionRequest.transactionData.height.toString()}
          upgradeVersion={transactionRequest.transactionData.version}
          upgradeType={
            transactionRequest.transactionData.version === "FEATURE"
              ? "features"
              : "version"
          }
          features={transactionRequest.transactionData.features.map(
            (rawFeature) => {
              const [feature, height] = rawFeature.split(":");
              return {
                feature,
                height,
              };
            }
          )}
        />
      );
      break;
    }
    default: {
      throw new Error("Invalid transaction request");
    }
  }

  return (
    <Stack
      flexGrow={1}
      width={WIDTH}
      component={"form"}
      onSubmit={handleSubmit(onSubmit)}
    >
      <RequestInfo
        title={""}
        description={""}
        origin={transactionRequest.origin}
      />
      <Stack
        bgcolor={themeColors.white}
        paddingY={1.6}
        paddingX={2}
        flexGrow={1}
        minHeight={0}
        flexBasis={"1px"}
      >
        <Typography variant={"subtitle2"} marginBottom={0.8}>
          {getTransactionTypeLabel(getTransactionType(transactionRequest))}{" "}
          Transaction
        </Typography>
        <FormProvider {...methods}>{summaryComponent}</FormProvider>
      </Stack>
      <Stack height={85}>
        <DialogButtons
          primaryButtonProps={{
            isLoading,
            children: "Send",
            disabled: !fee,
            type: "submit",
          }}
          secondaryButtonProps={{
            children: "Cancel",
            disabled: isLoading,
            onClick: rejectRequest,
          }}
        />
      </Stack>
    </Stack>
  );
}
