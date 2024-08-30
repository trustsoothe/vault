import type { PoktTxRequest } from "../../types/communications/transactions";
import Stack from "@mui/material/Stack";
import { useLocation } from "react-router-dom";
import Typography from "@mui/material/Typography";
import { closeSnackbar, SnackbarKey } from "notistack";
import React, { useEffect, useRef, useState } from "react";
import { Controller, FormProvider, useForm } from "react-hook-form";
import {
  enqueueErrorSnackbar,
  roundAndSeparate,
  wrongPasswordSnackbar,
} from "../../utils/ui";
import {
  PocketNetworkFee,
  SupportedProtocols,
  ValidateTransactionResult,
} from "@poktscan/vault";
import AppToBackground from "../../controllers/communication/AppToBackground";
import VaultPasswordInput from "../Transaction/VaultPasswordInput";
import useBalanceAndUsdPrice from "../hooks/useBalanceAndUsdPrice";
import Summary, { SummaryProps } from "../components/Summary";
import { AmountWithUsd } from "../Transaction/BaseSummary";
import CopyAddressButton from "../Home/CopyAddressButton";
import DialogButtons from "../components/DialogButtons";
import AccountInfo from "../components/AccountInfo";
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
} from "../../constants/communication";

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
  let summaries: Array<SummaryProps> = [];

  switch (transactionRequest.type) {
    case STAKE_NODE_REQUEST: {
      const firstSummary: SummaryProps = {
        containerProps: {
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

      if (
        transactionRequest.transactionData.outputAddress ||
        transactionRequest.transactionData.address !==
          transactionRequest.transactionData.nodeAddress
      ) {
        firstSummary.rows.push({
          type: "row",
          label: "Output Address",
          value: (
            <CopyAddressButton
              address={
                transactionRequest.transactionData.outputAddress ||
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

      break;
    }
    case UNJAIL_NODE_REQUEST:
    case UNSTAKE_NODE_REQUEST: {
      summaries = [
        {
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
      break;
    }
    case STAKE_APP_REQUEST: {
      summaries = [
        {
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
                  isLoadingUsdPrice={
                    fee.fetchingFee || balanceAndUsdPrice.isLoadingUsdPrice
                  }
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
          ],
        },
        {
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
        },
      ];

      break;
    }
    case TRANSFER_APP_REQUEST: {
      summaries = [
        {
          rows: [
            {
              type: "row",
              label: "Transfer To",
              // todo: get public key from vault
              value: transactionRequest.transactionData.newAppPublicKey,
            },
          ],
        },
      ];

      break;
    }
    case UNSTAKE_APP_REQUEST: {
      summaries = [
        {
          rows: [
            {
              type: "row",
              label: "App Address",
              value: (
                <CopyAddressButton
                  address={transactionRequest.transactionData.address}
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
      break;
    }
    case CHANGE_PARAM_REQUEST: {
      summaries = [
        {
          rows: [
            {
              type: "row",
              label: "Parameter",
              value: transactionRequest.transactionData.paramKey,
            },
            {
              type: "row",
              label: "Value",
              value: transactionRequest.transactionData.paramValue,
            },
            {
              type: "row",
              label: "Override Gov Params Whitelist Validation",
              value:
                transactionRequest.transactionData
                  .overrideGovParamsWhitelistValidation,
            },
          ],
        },
      ];

      break;
    }
    case DAO_TRANSFER_REQUEST: {
      summaries = [
        {
          rows: [
            {
              type: "row",
              label: "From",
              value: (
                <AccountInfo
                  address={transactionRequest.transactionData.address}
                  name={"Main POKT"}
                />
              ),
            },
            {
              type: "row",
              label: "To",
              value: (
                <AccountInfo
                  address={transactionRequest.transactionData.to}
                  name={"New App"}
                />
              ),
            },
            {
              type: "row",
              label: "Amount",
              value: (
                <AmountWithUsd
                  balance={
                    Number(transactionRequest.transactionData.amount) / 1e6
                  }
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
              label: "DAO Action",
              value:
                transactionRequest.transactionData.daoAction === "dao_burn"
                  ? "Burn"
                  : "Transfer",
            },
          ],
        },
      ];
      break;
    }
    default: {
      throw new Error("Invalid transaction request");
    }
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
          <Controller
            control={methods.control}
            name="amount"
            rules={{
              validate: () => {
                if ("amount" in transactionRequest.transactionData) {
                  if (isNaN(balanceAndUsdPrice?.balance) || isNaN(fee?.value)) {
                    return "";
                  }

                  if (
                    Number(transactionRequest.transactionData.amount) / 1e6 +
                      fee.value >
                    balanceAndUsdPrice.balance
                  ) {
                    return `Insufficient balance. Current balance: ${balanceAndUsdPrice.balance} ${balanceAndUsdPrice.coinSymbol}`;
                  }
                }

                return true;
              },
            }}
            render={({ fieldState: { error } }) => (
              <>
                <Stack overflow={"auto"} marginTop={1}>
                  {summaries.map((summary, index) => (
                    <Summary {...summary} key={index} />
                  ))}
                </Stack>
                {error && (
                  <Typography
                    fontSize={11}
                    marginTop={0.8}
                    lineHeight={"16px"}
                    color={themeColors.red}
                  >
                    {error.message}
                  </Typography>
                )}
              </>
            )}
          />
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
