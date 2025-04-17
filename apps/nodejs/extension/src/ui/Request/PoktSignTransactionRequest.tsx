import React, { useRef, useState } from "react";
import { closeSnackbar, SnackbarKey } from "notistack";
import { useLocation } from "react-router-dom";
import {
  AppBulkSignTransactionReq,
  SignTransactionBodyShannon,
} from "../../types/communications/transactions";
import {
  PocketNetworkAppStake,
  PocketNetworkAppTransfer,
  PocketNetworkAppUnstake,
  PocketNetworkGovChangeParam,
  PocketNetworkGovDAOTransfer,
  PocketNetworkGovUpgrade,
  PocketNetworkNodeStake,
  PocketNetworkNodeUnjail,
  PocketNetworkNodeUnstake,
  PocketNetworkSend,
  SupportedProtocols,
} from "@soothe/vault";
import { FormProvider, useForm } from "react-hook-form";
import AppToBackground from "../../controllers/communication/AppToBackground";
import { enqueueErrorSnackbar, wrongPasswordSnackbar } from "../../utils/ui";
import { getTransactionTypeLabel } from "./PoktTransactionRequest";
import Stack from "@mui/material/Stack";
import { WIDTH } from "../../constants/ui";
import RequestInfo from "./RequestInfo";
import { themeColors } from "../theme";
import Typography from "@mui/material/Typography";
import DialogButtons from "../components/DialogButtons";
import StakeNodeSummary from "../PoktTransaction/StakeNode/Summary";
import UnstakeUnjailNodeSummary from "../PoktTransaction/UnstakeUnjailNode/Summary";
import StakeAppSummary from "../PoktTransaction/StakeApp/Summary";
import TransferAppSummary from "../PoktTransaction/TransferApp/Summary";
import UnstakeApp from "../PoktTransaction/UnstakeApp/SummaryForm";
import ChangeParamSummary from "../PoktTransaction/ChangeParam/Summary";
import DaoTransferSummary from "../PoktTransaction/DaoTransfer/Summary";
import UpgradeSummary from "../PoktTransaction/Upgrade/Summary";
import CheckInput from "../PoktTransaction/CheckInput";
import VaultPasswordInput from "../Transaction/VaultPasswordInput";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  SxProps,
} from "@mui/material";
import ExpandIcon from "../assets/img/expand_select_icon.svg";
import PoktSignSendSummary from "./PoktSignSendSummary";
import StakeSupplierSummary from "../PocketShannonTransaction/StakeSupplier/Summary/Summary";
import UnstakeSupplierSummary from "../PocketShannonTransaction/UnstakeSupplier/Summary";

type Transaction = AppBulkSignTransactionReq["data"]["transactions"][number];

interface CustomAccordionProps {
  children: React.ReactNode;
  title: string;
  accordionSxProps?: SxProps;
}

function CustomAccordion({
  children,
  title,
  accordionSxProps,
}: CustomAccordionProps) {
  return (
    <Accordion
      sx={{
        marginBottom: "6px!important",
        marginTop: "0!important",
        ...accordionSxProps,
      }}
      elevation={0}
    >
      <AccordionSummary
        expandIcon={<ExpandIcon />}
        sx={{
          minHeight: "36px!important",
          height: "36px!important",
          paddingX: 1.2,
          "& .MuiAccordionSummary-content": {
            marginY: "0px!important",
          },
        }}
      >
        <Typography variant={"subtitle2"}>{title}</Typography>
      </AccordionSummary>
      <AccordionDetails
        sx={{
          padding: 0,
        }}
      >
        {children}
      </AccordionDetails>
    </Accordion>
  );
}

function getMessageLabel(
  typeUrl: SignTransactionBodyShannon["messages"][number]["typeUrl"]
) {
  switch (typeUrl) {
    case "/cosmos.bank.v1beta1.MsgSend":
      return "Send";
    case "/pocket.supplier.MsgStakeSupplier":
      return "Stake Supplier";
    case "/pocket.supplier.MsgUnstakeSupplier":
      return "Unstake Supplier";
    default:
      return "Unknown";
  }
}

function getTransactionLabel(transaction: Transaction) {
  if (transaction.protocol === SupportedProtocols.Pocket) {
    return getTransactionTypeLabel(transaction.type);
  }

  if (transaction.protocol === SupportedProtocols.Cosmos) {
    const uniqueMessages = new Set(
      transaction.messages.map((message) => message.typeUrl)
    );

    const messageLabels = Array.from(uniqueMessages)
      .slice(0, 2)
      .map(getMessageLabel);

    if (uniqueMessages.size === 1) {
      return messageLabels[0];
    }

    if (uniqueMessages.size === 2) {
      return `${messageLabels[0]} & ${messageLabels[1]}`;
    }

    return `${messageLabels[0]}, ${messageLabels[1]} & more`;
  }

  return "";
}

type SummaryComponentProps = Transaction & {
  chainId: string;
};

function SummaryComponent({
  chainId,
  ...baseTransaction
}: SummaryComponentProps) {
  if (baseTransaction.protocol === SupportedProtocols.Pocket) {
    const { type, transaction } = baseTransaction;
    switch (type) {
      case PocketNetworkNodeStake: {
        return (
          <StakeNodeSummary
            fromAddress={transaction.address}
            chainId={chainId}
            amount={Number(transaction.amount) / 1e6}
            chains={transaction.chains}
            serviceURL={transaction.serviceURL}
            fee={null}
            nodeAddress={transaction.nodeAddress}
            outputAddress={transaction.outputAddress}
            memo={transaction.memo}
            rewardDelegators={transaction.rewardDelegators}
            hidePasswordInput={true}
            avoidFeeChecking={true}
          />
        );
      }
      case PocketNetworkNodeUnjail:
      case PocketNetworkNodeUnstake: {
        return (
          <UnstakeUnjailNodeSummary
            signerAddress={transaction.address}
            nodeAddress={transaction.nodeAddress}
            chainId={chainId}
            fee={null}
            hidePasswordInput={true}
            avoidFeeChecking={true}
          />
        );
      }
      case PocketNetworkAppStake: {
        return (
          <StakeAppSummary
            appAddress={transaction.address}
            chainId={chainId}
            amount={Number(transaction.amount) / 1e6}
            chains={transaction.chains}
            fee={null}
            memo={transaction.memo}
            hidePasswordInput={true}
            avoidFeeChecking={true}
          />
        );
      }
      case PocketNetworkAppTransfer: {
        return (
          <TransferAppSummary
            appAddress={transaction.address}
            chainId={chainId}
            fee={null}
            memo={transaction.memo}
            newAppPublicKey={transaction.newAppPublicKey}
            hidePasswordInput={true}
            avoidFeeChecking={true}
          />
        );
      }
      case PocketNetworkAppUnstake: {
        return (
          <UnstakeApp
            fromAddress={transaction.address}
            chainId={chainId}
            fee={null}
            memo={transaction.memo}
            canEditMemo={false}
            addTitle={false}
            hidePasswordInput={true}
            avoidFeeChecking={true}
          />
        );
      }
      case PocketNetworkGovChangeParam: {
        return (
          <ChangeParamSummary
            fromAddress={transaction.address}
            chainId={chainId}
            fee={null}
            memo={transaction.memo}
            paramKey={transaction.paramKey}
            paramValue={transaction.paramValue}
            overrideGovParamsWhitelistValidation={
              transaction.overrideGovParamsWhitelistValidation
            }
            hidePasswordInput={true}
            avoidFeeChecking={true}
          />
        );
      }
      case PocketNetworkGovDAOTransfer: {
        return (
          <DaoTransferSummary
            fromAddress={transaction.address}
            chainId={chainId}
            fee={null}
            memo={transaction.memo}
            daoAction={transaction.daoAction}
            amount={Number(transaction.amount) / 1e6}
            to={transaction.to}
            hidePasswordInput={true}
            avoidFeeChecking={true}
          />
        );
      }
      case PocketNetworkGovUpgrade: {
        return (
          <UpgradeSummary
            fromAddress={transaction.address}
            chainId={chainId}
            fee={null}
            memo={transaction.memo}
            upgradeHeight={transaction.height.toString()}
            upgradeVersion={transaction.version}
            upgradeType={
              transaction.version === "FEATURE" ? "features" : "version"
            }
            features={transaction.features.map((rawFeature) => {
              const [feature, height] = rawFeature.split(":");
              return {
                feature,
                height,
              };
            })}
            hidePasswordInput={true}
            avoidFeeChecking={true}
          />
        );
      }
      case PocketNetworkSend: {
        return (
          <PoktSignSendSummary
            fromAddress={transaction.from}
            chainId={chainId}
            amount={Number(transaction.amount) / 1e6}
            toAddress={transaction.to}
            memo={transaction.memo}
            protocol={baseTransaction.protocol}
          />
        );
      }
      default: {
        throw new Error("Invalid transaction request");
      }
    }
  } else if (baseTransaction.protocol === SupportedProtocols.Cosmos) {
  }

  return null;
}

function MessageSummary({
  address,
  chainId,
  message,
  memo,
}: {
  address: string;
  chainId: string;
  memo?: string;
  message: SignTransactionBodyShannon["messages"][number];
}) {
  switch (message.typeUrl) {
    case "/cosmos.bank.v1beta1.MsgSend":
      return (
        <PoktSignSendSummary
          fromAddress={address}
          chainId={chainId}
          amount={Number(message.body.amount) / 1e6}
          toAddress={message.body.toAddress}
          memo={memo}
          protocol={SupportedProtocols.Cosmos}
        />
      );
    case "/pocket.supplier.MsgStakeSupplier":
      return (
        <StakeSupplierSummary
          fromAddress={address}
          chainId={chainId}
          amount={Number(message.body.stakeAmount) / 1e6}
          supplierServices={message.body.services}
          fee={null}
          operatorAddress={message.body.operatorAddress}
          ownerAddress={message.body.ownerAddress}
          // memo={memo}
        />
      );
    case "/pocket.supplier.MsgUnstakeSupplier":
      return (
        <UnstakeSupplierSummary
          signerAddress={address}
          chainId={chainId}
          operatorAddress={message.body.operatorAddress}
          fee={null}
        />
      );
    default:
      throw new Error("Invalid message type");
  }
}

interface ShannonTransactionSummaryProps {
  transaction: Transaction;
  chainId: string;
}

function ShannonTransactionSummary({
  transaction,
  chainId,
}: ShannonTransactionSummaryProps) {
  if (transaction.protocol !== SupportedProtocols.Cosmos) {
    throw new Error("Invalid protocol");
  }

  if (transaction.messages.length === 1) {
    const message = transaction.messages[0];
    return (
      <MessageSummary
        message={message}
        chainId={chainId}
        address={transaction.address}
        memo={transaction.memo}
      />
    );
  } else {
    return (
      <>
        {transaction.messages.map((message, index) => (
          <CustomAccordion
            title={getMessageLabel(message.typeUrl)}
            key={message.typeUrl + index}
          >
            <Stack marginTop={-1.2}>
              <MessageSummary
                message={message}
                chainId={chainId}
                address={transaction.address}
                memo={transaction.memo}
              />
            </Stack>
          </CustomAccordion>
        ))}
      </>
    );
  }
}

interface TransactionSummaryProps {
  transactions: Array<Transaction>;
  protocol: SupportedProtocols;
  chainId: string;
  isError: boolean;
}

function TransactionsSummary({
  transactions,
  protocol,
  chainId,
  isError,
}: TransactionSummaryProps) {
  if (protocol === SupportedProtocols.Pocket) {
    if (transactions.length === 1) {
      const transaction = transactions[0];
      return <SummaryComponent chainId={chainId} {...transaction} />;
    } else {
      return (
        <>
          {isError && (
            <Typography
              fontSize={11}
              lineHeight={"16px"}
              color={themeColors.red}
              marginBottom={1.2}
            >
              There are errors in the transactions. Please check and try again.
            </Typography>
          )}
          {transactions.map((transaction) => (
            <CustomAccordion title={getTransactionLabel(transaction)}>
              <Stack marginTop={-1.2}>
                <SummaryComponent chainId={chainId} {...transaction} />
              </Stack>
            </CustomAccordion>
          ))}
        </>
      );
    }
  } else if (protocol === SupportedProtocols.Cosmos) {
    if (transactions.length === 1) {
      return (
        <ShannonTransactionSummary
          chainId={chainId}
          transaction={transactions[0]}
        />
      );
    }

    return (
      <>
        {transactions.map((transaction: SignTransactionBodyShannon) => (
          <CustomAccordion
            title={`${getTransactionLabel(transaction)} Transaction`}
            accordionSxProps={{
              marginBottom: "6px!important",
              marginTop: "0!important",
              border: `1px solid ${themeColors.light_gray1}`,
              borderTop: "none",
            }}
          >
            <Stack
              paddingX={1.2}
              paddingTop={1.2}
              paddingBottom={0.6}
              borderRadius={"12px"}
              bgcolor={themeColors.white}
            >
              {transaction.messages.length > 1 && (
                <Typography marginBottom={0.8} fontSize={12} fontWeight={500}>
                  Messages [{transaction.messages.length}]
                </Typography>
              )}
              <ShannonTransactionSummary
                chainId={chainId}
                transaction={transaction}
              />
            </Stack>
          </CustomAccordion>
        ))}
      </>
    );
  } else {
    throw new Error("Invalid protocol");
  }
}

export default function PoktSignTransactionRequest() {
  const errorSnackbarKey = useRef<SnackbarKey>();
  const wrongPasswordSnackbarKey = useRef<SnackbarKey>(null);
  const [isLoading, setIsLoading] = useState(false);
  const location = useLocation();
  const transactionRequest: AppBulkSignTransactionReq = location.state;

  const closeSnackbars = () => {
    if (errorSnackbarKey.current) {
      closeSnackbar(errorSnackbarKey.current);
      errorSnackbarKey.current = null;
    }

    if (wrongPasswordSnackbarKey.current) {
      closeSnackbar(wrongPasswordSnackbarKey.current);
      wrongPasswordSnackbarKey.current = null;
    }
  };
  const methods = useForm<{ vaultPassword: string; fee }>({
    defaultValues: {
      vaultPassword: "",
    },
  });

  const rejectRequest = () => {
    setIsLoading(true);
    AppToBackground.signTransactions({
      vaultPassword: "",
      rejected: true,
      fee: 0,
      request: transactionRequest,
      data: null,
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

  const onSubmit = (data: { vaultPassword: string }) => {
    setIsLoading(true);

    AppToBackground.signTransactions({
      vaultPassword: data.vaultPassword,
      request: transactionRequest,
      rejected: false,
      fee: 0,
      data: transactionRequest.data,
    })
      .then((res) => {
        if (res.error) {
          errorSnackbarKey.current = enqueueErrorSnackbar({
            variant: "error",
            message: {
              title: "Failed to answer the request",
              content: `There was an error signing the transaction(s).`,
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
            content: `There was an error signing the transaction(s).`,
          },
          onRetry: () => onSubmit(data),
        });
      })
      .finally(() => setIsLoading(false));
  };

  return (
    <Stack
      flexGrow={1}
      width={WIDTH}
      component={"form"}
      onSubmit={methods.handleSubmit(onSubmit)}
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
          {transactionRequest.data.transactions.length > 1
            ? `Sign Multiple Transactions [${transactionRequest.data.transactions.length}]`
            : `Sign ${getTransactionLabel(
                transactionRequest.data.transactions[0]
              )} Transaction`}
        </Typography>
        <FormProvider {...methods}>
          <Stack overflow={"auto"} flexGrow={1} minHeight={0} flexBasis={"1px"}>
            <TransactionsSummary
              transactions={transactionRequest.data.transactions}
              protocol={transactionRequest.data.transactions[0].protocol}
              chainId={transactionRequest.data.chainId}
              isError={!!methods.formState.errors.fee?.message}
            />
          </Stack>
          <CheckInput
            isSigning={true}
            moreThanOne={transactionRequest.data.transactions.length > 1}
          />
          <VaultPasswordInput />
        </FormProvider>
      </Stack>
      <Stack height={85}>
        <DialogButtons
          primaryButtonProps={{
            isLoading,
            children: "Sign",
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
