import Stack from "@mui/material/Stack";
import { useLocation } from "react-router-dom";
import { closeSnackbar, SnackbarKey } from "notistack";
import React, { useEffect, useRef, useState } from "react";
import {
  enqueueErrorSnackbar,
  roundAndSeparate,
  wrongPasswordSnackbar,
} from "../../utils/ui";
import AppToBackground from "../../controllers/communication/AppToBackground";
import DialogButtons from "../components/DialogButtons";
import { WIDTH } from "../../constants/ui";
import RequestInfo from "./RequestInfo";
import { themeColors } from "../theme";
import {
  AppChangeParamReq,
  AppDaoTransferReq,
  AppStakeAppReq,
  AppStakeNodeReq,
  AppTransferAppReq,
  AppUnjailNodeReq,
  AppUnstakeAppReq,
  AppUnstakeNodeReq,
} from "../../types/communications/transactions";
import {
  CHANGE_PARAM_REQUEST,
  DAO_TRANSFER_REQUEST,
  STAKE_APP_REQUEST,
  STAKE_NODE_REQUEST,
  TRANSFER_APP_REQUEST,
  UNJAIL_NODE_REQUEST,
  UNSTAKE_APP_REQUEST,
  UNSTAKE_NODE_REQUEST,
} from "../../constants/communication";
import {
  PocketNetworkFee,
  SupportedProtocols,
  ValidateTransactionResult,
} from "@poktscan/vault";
import { FormProvider, useForm } from "react-hook-form";
import VaultPasswordInput from "../Transaction/VaultPasswordInput";
import Typography from "@mui/material/Typography";
import Summary, { SummaryProps } from "../components/Summary";
import { AmountWithUsd } from "../Transaction/BaseSummary";
import useBalanceAndUsdPrice from "../hooks/useBalanceAndUsdPrice";
import CopyAddressButton from "../Home/CopyAddressButton";

type PoktTxRequest =
  | AppStakeNodeReq
  | AppUnstakeNodeReq
  | AppUnjailNodeReq
  | AppStakeAppReq
  | AppTransferAppReq
  | AppUnstakeAppReq
  | AppChangeParamReq
  | AppDaoTransferReq;

function getTransactionFn(transactionRequest: PoktTxRequest) {
  let fn:
    | typeof AppToBackground.stakeNode
    | typeof AppToBackground.unstakeNode
    | typeof AppToBackground.unjailNode
    | typeof AppToBackground.stakeApp
    | typeof AppToBackground.transferApp
    | typeof AppToBackground.unstakeApp
    | typeof AppToBackground.changeParam
    | typeof AppToBackground.daoTransfer;

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
    default:
      throw new Error("Invalid transaction request");
  }
  return fn;
}

function getTransactionType(transactionRequest: PoktTxRequest) {
  switch (transactionRequest.type) {
    case STAKE_NODE_REQUEST:
      return "Stake Node";
    case UNSTAKE_NODE_REQUEST:
      return "Unstake Node";
    case UNJAIL_NODE_REQUEST:
      return "Unjail Node";
    case STAKE_APP_REQUEST:
      return "Stake App";
    case TRANSFER_APP_REQUEST:
      return "Transfer App";
    case UNSTAKE_APP_REQUEST:
      return "Unstake App";
    case CHANGE_PARAM_REQUEST:
      return "Change Param";
    case DAO_TRANSFER_REQUEST:
      return "DAO Transfer";
    default:
      throw new Error("Invalid transaction request");
  }
}

function getTransactionDescription(transactionRequest: PoktTxRequest) {
  switch (transactionRequest.type) {
    case STAKE_NODE_REQUEST: {
      const { transactionData } = transactionRequest;

      return `Are you sure you want to stake ${roundAndSeparate(
        Number(transactionData.amount) / 1e6,
        6
      )} POKT? You will have to wait 21 days after unstaking it to recover your stake.`;
    }
    case UNSTAKE_NODE_REQUEST: {
      return "Are you sure you want to unstake this node?\nYou will have to wait 21 days after unstaking it to recover your stake and your node will not received any rewards.";
    }
    default:
      return "";
  }
}

function getTransactionRows(
  transactionRequest: PoktTxRequest,
  balanceAndUsdPrice: ReturnType<typeof useBalanceAndUsdPrice>,
  fee: {
    fee: PocketNetworkFee;
    fetchingFee: boolean;
  }
): Array<SummaryProps> {
  switch (transactionRequest.type) {
    case STAKE_NODE_REQUEST: {
      const summaries: Array<SummaryProps> = [];

      const firstSummary: SummaryProps = {
        containerProps: {
          marginTop: 1,
          paddingBottom: 0,
        },
        rows: [
          {
            type: "row",
            label: "Stake Amount",
            value: (
              <AmountWithUsd
                balance={
                  Number(transactionRequest.transactionData.amount) / 1e6
                }
                decimals={6}
                symbol={balanceAndUsdPrice.coinSymbol}
                usdBalance={balanceAndUsdPrice.usdBalance}
                isLoadingUsdPrice={false}
              />
            ),
          },
          {
            type: "row",
            label: "Fee",
            value: (
              <AmountWithUsd
                balance={fee.fee?.value || 0}
                decimals={6}
                symbol={balanceAndUsdPrice.coinSymbol}
                usdBalance={balanceAndUsdPrice.usdBalance}
                isLoadingUsdPrice={
                  fee.fetchingFee || balanceAndUsdPrice.isLoadingUsdPrice
                }
              />
            ),
          },
          {
            type: "row",
            label: "Service URL",
            value: transactionRequest.transactionData.serviceURL,
          },
          {
            type: "row",
            label: "Node Address",
            value: (
              <CopyAddressButton
                address={transactionRequest.transactionData.nodeAddress}
                sxProps={{
                  fontWeight: 500,
                  boxShadow: "none",
                  marginRight: -0.8,
                  color: themeColors.black,
                  backgroundColor: "transparent",
                }}
              />
            ),
          },
        ],
      };

      if (transactionRequest.transactionData.outputAddress) {
        firstSummary.rows.push({
          type: "row",
          label: "Output Address",
          value: (
            <CopyAddressButton
              address={transactionRequest.transactionData.outputAddress}
              sxProps={{
                fontWeight: 500,
                boxShadow: "none",
                marginRight: -0.8,
                color: themeColors.black,
                backgroundColor: "transparent",
              }}
            />
          ),
        });
      }

      summaries.push(firstSummary, {
        containerProps: {
          paddingTop: 0.8,
        },
        rows: [
          {
            type: "row",
            label: "Chains",
            value: transactionRequest.transactionData.chains.join("\n"),
            containerProps: {
              sx: {
                alignItems: "flex-start",
                "& h6": {
                  whiteSpace: "pre",
                },
              },
            },
          },
        ],
      });

      if (transactionRequest.transactionData.rewardDelegators) {
        summaries.push(
          {
            containerProps: {
              paddingTop: 0,
              paddingBottom: 0,
              marginTop: -1.2,
            },
            rows: [
              {
                type: "row",
                label: "Reward Delegators",
                value: "",
                containerProps: {
                  sx: {
                    alignItems: "flex-start",
                    "& h6": {
                      whiteSpace: "pre",
                    },
                  },
                },
              },
            ],
          },
          {
            containerProps: {
              paddingTop: 0.4,
              paddingLeft: 2,
              sx: {
                "& p": {
                  textOverflow: "ellipsis",
                  overflow: "hidden",
                  whiteSpace: "nowrap",
                },
                "& h6": {
                  textOverflow: "unset",
                  overflow: "unset",
                  whiteSpace: "unset",
                },
              },
            },
            rows:
              Object.entries(
                transactionRequest.transactionData.rewardDelegators
              ).map(([key, value]) => ({
                type: "row",
                label: key,
                value: value + "%",
              })) || [],
          }
        );
      }

      if (transactionRequest.transactionData.memo) {
        summaries.push({
          containerProps: {
            paddingTop: 0,
            marginTop: -0.6,
          },
          rows: [
            {
              type: "row",
              label: "Memo",
              value: transactionRequest.transactionData.memo,
            },
          ],
        });
      }

      return summaries;
    }
    case UNSTAKE_NODE_REQUEST: {
      return [
        {
          containerProps: {
            marginTop: 1,
          },
          rows: [
            {
              type: "row",
              label: "Node Address",
              value: (
                <CopyAddressButton
                  address={
                    transactionRequest.transactionData.nodeAddress ||
                    transactionRequest.transactionData.address
                  }
                  sxProps={{
                    fontWeight: 500,
                    boxShadow: "none",
                    marginRight: -0.8,
                    color: themeColors.black,
                    backgroundColor: "transparent",
                  }}
                />
              ),
            },
          ],
        },
      ];
    }
    default:
      throw new Error("Invalid transaction request");
  }
}

interface PoktTxForm {
  fee?: PocketNetworkFee;
  fetchingFee?: boolean;
  vaultPassword?: string;
}

export default function PoktTransactionRequest() {
  const errorSnackbarKey = useRef<SnackbarKey>();
  const feeErrorSnackbarKey = useRef<SnackbarKey>(null);
  const wrongPasswordSnackbarKey = useRef<SnackbarKey>(null);
  const [isLoading, setIsLoading] = useState(false);
  const location = useLocation();
  const transactionRequest: PoktTxRequest = location.state;
  const balanceAndUsdPrice = useBalanceAndUsdPrice({
    address: transactionRequest.transactionData.address,
    protocol: SupportedProtocols.Pocket,
    chainId: transactionRequest.transactionData.chainId,
  });
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
  const { getValues, reset, handleSubmit, watch, setValue } = methods;

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

  const description = getTransactionDescription(transactionRequest);
  const summaries = getTransactionRows(transactionRequest, balanceAndUsdPrice, {
    fee,
    fetchingFee,
  });

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
        <Typography variant={"subtitle2"}>
          {getTransactionType(transactionRequest)} Transaction
        </Typography>
        {description && (
          <Typography fontSize={11} whiteSpace={"pre-line"}>
            {description}
          </Typography>
        )}
        <FormProvider {...methods}>
          {summaries.map((summary, index) => (
            <Summary {...summary} key={index} />
          ))}
          <VaultPasswordInput />
        </FormProvider>
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
