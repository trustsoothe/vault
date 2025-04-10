import React, { useRef, useState } from "react";
import { closeSnackbar, SnackbarKey } from "notistack";
import { useLocation } from "react-router-dom";
import { AppBulkSignTransactionReq } from "../../types/communications/transactions";
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
import { Accordion, AccordionDetails, AccordionSummary } from "@mui/material";
import ExpandIcon from "../assets/img/expand_select_icon.svg";
import PoktSignSendSummary from "./PoktSignSendSummary";

type SummaryComponentProps =
  AppBulkSignTransactionReq["data"]["transactions"][number] & {
    chainId: string;
  };

function SummaryComponent({
  chainId,
  type,
  transaction,
}: SummaryComponentProps) {
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
        />
      );
    }
    default: {
      throw new Error("Invalid transaction request");
    }
  }

  return null;
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
              content: `There was an error trying to sign the transaction(s).`,
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
            content: `There was an error trying to sign the transaction(s).`,
          },
          onRetry: () => onSubmit(data),
        });
      })
      .finally(() => setIsLoading(false));
  };

  let content: React.ReactNode;

  if (transactionRequest.data.transactions.length === 1) {
    const transaction = transactionRequest.data.transactions[0];
    content = (
      <SummaryComponent
        chainId={transactionRequest.data.chainId}
        {...transaction}
      />
    );
  } else {
    content = (
      <>
        {methods.formState.errors.fee?.message && (
          <Typography
            fontSize={11}
            lineHeight={"16px"}
            color={themeColors.red}
            marginBottom={1.2}
          >
            There are errors in the transactions. Please check and try again.
          </Typography>
        )}
        {transactionRequest.data.transactions.map((transaction) => (
          <Accordion
            sx={{ marginBottom: "6px!important", marginTop: "0!important" }}
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
              <Typography variant={"subtitle2"}>
                {getTransactionTypeLabel(transaction.type)}
              </Typography>
            </AccordionSummary>
            <AccordionDetails
              sx={{
                padding: 0,
              }}
            >
              <Stack marginTop={-1.2}>
                <SummaryComponent
                  chainId={transactionRequest.data.chainId}
                  {...transaction}
                />
              </Stack>
            </AccordionDetails>
          </Accordion>
        ))}
      </>
    );
  }

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
            : `${getTransactionTypeLabel(
                transactionRequest.data.transactions[0].type
              )} Transaction`}
        </Typography>
        <FormProvider {...methods}>
          <Stack overflow={"auto"} flexGrow={1} minHeight={0} flexBasis={"1px"}>
            {content}
          </Stack>
          <CheckInput />
          <VaultPasswordInput />
        </FormProvider>
      </Stack>
      <Stack height={85}>
        <DialogButtons
          primaryButtonProps={{
            isLoading,
            children: "Send",
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
