import {
  PoktTransaction,
  Transaction,
  TransactionStatus,
} from "../../controllers/datasource/Transaction";
import Decimal from "decimal.js";
import Stack from "@mui/material/Stack";
import React, { useEffect, useRef } from "react";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import {
  PocketNetworkFee,
  PocketNetworkTransactionTypes,
  SerializedAccountReference,
  SupportedProtocols,
} from "@soothe/vault";
import { AmountWithUsd, getNetworkRow } from "../Transaction/BaseSummary";
import SuccessActionBanner from "../components/SuccessActionBanner";
import { contactsSelector } from "../../redux/selectors/contact";
import { networksSelector } from "../../redux/selectors/network";
import Summary, { SummaryRowItem } from "../components/Summary";
import useSelectedAsset from "../Home/hooks/useSelectedAsset";
import DialogButtons from "../components/DialogButtons";
import { Hash } from "../Transaction/TransactionHash";
import { useAppSelector } from "../hooks/redux";
import BaseDialog from "../components/BaseDialog";
import useUsdPrice from "../hooks/useUsdPrice";
import {
  accountsSelector,
  selectedAccountAddressSelector,
} from "../../redux/selectors/account";
import UpgradeSummary from "../PoktTransaction/Upgrade/Summary";
import StakeAppSummary from "../PoktTransaction/StakeApp/Summary";
import UnstakeApp from "../PoktTransaction/UnstakeApp/SummaryForm";
import StakeNodeSummary from "../PoktTransaction/StakeNode/Summary";
import TransferAppSummary from "../PoktTransaction/TransferApp/Summary";
import ChangeParamSummary from "../PoktTransaction/ChangeParam/Summary";
import DaoTransferSummary from "../PoktTransaction/DaoTransfer/Summary";
import { getTransactionTypeLabel } from "../Request/PoktTransactionRequest";
import AccountInfo, { AccountInfoFromAddress } from "../components/AccountInfo";
import UnstakeUnjailNodeSummary from "../PoktTransaction/UnstakeUnjailNode/Summary";
import Typography from "@mui/material/Typography";
import { themeColors } from "../theme";
import FailedActionBanner from "../components/FailedActionBanner";

function getTxSummaryRows(transaction: Transaction) {
  const txSummaryItems: Array<SummaryRowItem> = [
    {
      type: "row",
      label: "Tx. Hash",
      value: (
        <Hash
          hash={transaction.hash}
          protocol={transaction.protocol}
          chainId={transaction.chainId}
        />
      ),
    },
  ];

  if (transaction.status === TransactionStatus.Invalid) {
    txSummaryItems.push({
      type: "row",
      label: "Code",
      value: transaction.code?.toString() || "0",
    });

    if ("codespace" in transaction) {
      txSummaryItems.push({
        type: "row",
        label: "Codespace",
        value: transaction.codespace,
      });
    }

    if ("log" in transaction) {
      txSummaryItems.push({
        type: "row",
        label: "Raw Log",
        containerProps: {
          sx: {
            alignItems: "flex-start",
          },
        },
        value: (
          <Stack width={1} marginLeft={-9} marginTop={2.8}>
            <Typography
              fontSize={11}
              marginLeft={0.6}
              color={themeColors.black}
            >
              {transaction.log}
            </Typography>
          </Stack>
        ),
      });
    }
  }

  return txSummaryItems;
}

interface PoktTxDetailProps {
  transaction: Transaction;
}

function PoktTransactionDetailModal(props: PoktTxDetailProps) {
  const networks = useAppSelector(networksSelector);
  const poktTx = props.transaction as PoktTransaction;
  const network = networks.find(
    (network) =>
      network.protocol === poktTx.protocol && network.chainId === poktTx.chainId
  );
  const fee: {
    fee: PocketNetworkFee;
    fetchingFee: boolean;
  } = {
    fee: {
      value: poktTx.fee,
      protocol: SupportedProtocols.Pocket,
    },
    fetchingFee: false,
  };
  let summaryComponent: React.ReactNode;

  switch (poktTx.type) {
    case PocketNetworkTransactionTypes.NodeStake: {
      summaryComponent = (
        <StakeNodeSummary
          fromAddress={poktTx.from}
          chainId={poktTx.chainId}
          amount={poktTx.amount}
          chains={poktTx.transactionParams.chains}
          serviceURL={poktTx.transactionParams.serviceURL}
          fee={fee}
          outputAddress={poktTx.transactionParams.outputAddress}
          memo={poktTx.transactionParams.memo}
          rewardDelegators={poktTx.transactionParams.rewardDelegators}
          addValidation={false}
          nodePublicKey={poktTx.transactionParams.nodePublicKey}
        />
      );
      break;
    }
    case PocketNetworkTransactionTypes.NodeUnstake:
    case PocketNetworkTransactionTypes.NodeUnjail: {
      summaryComponent = (
        <UnstakeUnjailNodeSummary
          chainId={poktTx.chainId}
          signerAddress={poktTx.transactionParams.outputAddress || poktTx.from}
          nodeAddress={poktTx.from}
          fee={fee}
          addValidation={false}
        />
      );
      break;
    }
    case PocketNetworkTransactionTypes.AppStake: {
      summaryComponent = (
        <StakeAppSummary
          appAddress={poktTx.from}
          chainId={poktTx.chainId}
          amount={poktTx.amount}
          chains={poktTx.transactionParams.chains}
          fee={fee}
          memo={poktTx.transactionParams.memo}
          addValidation={false}
        />
      );
      break;
    }
    case PocketNetworkTransactionTypes.AppTransfer: {
      summaryComponent = (
        <TransferAppSummary
          appAddress={poktTx.from}
          chainId={poktTx.chainId}
          fee={fee}
          memo={poktTx.transactionParams.memo}
          newAppPublicKey={poktTx.transactionParams.appPublicKey}
          addValidation={false}
        />
      );
      break;
    }
    case PocketNetworkTransactionTypes.AppUnstake: {
      summaryComponent = (
        <UnstakeApp
          fromAddress={poktTx.from}
          chainId={poktTx.chainId}
          fee={fee}
          memo={poktTx.transactionParams.memo}
          canEditMemo={false}
          addTitle={false}
          addValidation={false}
        />
      );
      break;
    }
    case PocketNetworkTransactionTypes.GovChangeParam: {
      summaryComponent = (
        <ChangeParamSummary
          fromAddress={poktTx.from}
          chainId={poktTx.chainId}
          fee={fee}
          memo={poktTx.transactionParams.memo}
          paramKey={poktTx.transactionParams.paramKey}
          paramValue={poktTx.transactionParams.paramValue}
          overrideGovParamsWhitelistValidation={
            poktTx.transactionParams.overrideGovParamsWhitelistValidation
          }
          addValidation={false}
        />
      );
      break;
    }
    case PocketNetworkTransactionTypes.GovDAOTransfer: {
      summaryComponent = (
        <DaoTransferSummary
          fromAddress={poktTx.from}
          chainId={poktTx.chainId}
          fee={fee}
          memo={poktTx.transactionParams.memo}
          daoAction={poktTx.transactionParams.daoAction}
          amount={poktTx.amount}
          to={poktTx.transactionParams.to}
          addValidation={false}
        />
      );
      break;
    }
    case PocketNetworkTransactionTypes.GovUpgrade: {
      summaryComponent = (
        <UpgradeSummary
          fromAddress={poktTx.from}
          chainId={poktTx.chainId}
          fee={fee}
          memo={poktTx.transactionParams.memo}
          upgradeHeight={poktTx.transactionParams.upgrade.height.toString()}
          upgradeVersion={poktTx.transactionParams.upgrade.version}
          upgradeType={
            poktTx.transactionParams.upgrade.version === "FEATURE"
              ? "features"
              : "version"
          }
          features={poktTx.transactionParams.upgrade.features.map(
            (rawFeature) => {
              const [feature, height] = rawFeature.split(":");
              return {
                feature,
                height,
              };
            }
          )}
          addValidation={false}
        />
      );
      break;
    }
    default: {
      throw new Error("Invalid transaction request");
    }
  }

  const ActionBanner =
    props.transaction.status === TransactionStatus.Invalid
      ? FailedActionBanner
      : SuccessActionBanner;

  return (
    <DialogContent
      sx={{
        padding: "20px!important",
        rowGap: 1.6,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <ActionBanner
        label={`${getTransactionTypeLabel(poktTx.type)} Transaction Successful${
          props.transaction.status === TransactionStatus.Invalid
            ? " but Failed"
            : ""
        }`}
      />
      <Summary
        rows={[
          {
            type: "row",
            label: "From",
            value: (
              <AccountInfoFromAddress
                address={poktTx.from}
                protocol={poktTx.protocol}
              />
            ),
          },
          {
            type: "divider",
          },
          getNetworkRow(network),
        ]}
      />
      <Stack
        sx={{
          "& > div": {
            overflow: "unset",
          },
        }}
      >
        {summaryComponent}
      </Stack>
      <Summary rows={getTxSummaryRows(props.transaction)} />
    </DialogContent>
  );
}

interface ContentProps {
  transaction: Transaction;
}

function Content({ transaction }: ContentProps) {
  const asset = useSelectedAsset();
  const { usdPrice, coinSymbol, isLoading } = useUsdPrice({
    asset,
    protocol: transaction.protocol,
    chainId: transaction.chainId,
  });

  const selectedAccountAddress = useAppSelector(selectedAccountAddressSelector);
  const accounts = useAppSelector(accountsSelector);
  const contacts = useAppSelector(contactsSelector);
  const networks = useAppSelector(networksSelector);
  const network = networks.find(
    (network) =>
      network.protocol === transaction.protocol &&
      network.chainId === transaction.chainId
  );

  const wasReceived = selectedAccountAddress !== transaction.from;

  let fromAccount: SerializedAccountReference,
    recipientAccount: SerializedAccountReference;

  const recipientAddress = transaction.swapTo?.address || transaction.to;

  for (const account of accounts) {
    if (
      account.address === transaction.from &&
      account.protocol === transaction.protocol
    ) {
      fromAccount = account;
      continue;
    }

    if (
      account.address === recipientAddress &&
      account.protocol === (transaction.swapTo?.address || transaction.protocol)
    ) {
      recipientAccount = account;
    }
  }

  const recipientContact = contacts.find(
    (contact) =>
      contact.address === recipientAddress &&
      contact.protocol === (transaction.swapTo?.address || transaction.protocol)
  );

  const txDate = new Date(transaction.timestamp);
  const decimals =
    asset?.decimals || transaction.protocol === SupportedProtocols.Pocket
      ? 6
      : 18;

  const firstSummaryRow: Array<SummaryRowItem> = [
    {
      type: "row",
      label: "From",
      value: (
        <AccountInfo address={transaction.from} name={fromAccount?.name} />
      ),
    },
    { type: "divider" },
    {
      type: "row",
      label: "To",
      value: (
        <AccountInfo
          address={transaction.to}
          name={recipientContact?.name || recipientAccount?.name}
          type={recipientContact ? "contact" : "account"}
        />
      ),
    },
  ];

  if (transaction.swapTo) {
    const toNetwork = networks.find(
      (network) =>
        network.protocol === transaction.swapTo.network.protocol &&
        network.chainId === transaction.swapTo.network.chainId
    );
    firstSummaryRow.splice(1, 0, getNetworkRow(network));
    firstSummaryRow.splice(4, 0, getNetworkRow(toNetwork));
  } else {
    firstSummaryRow.push({ type: "divider" }, getNetworkRow(network));
  }

  const rows: Array<SummaryRowItem> = [
    {
      type: "row",
      label: "Date",
      value: `${txDate.toLocaleDateString(undefined, {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })}`,
    },
    {
      type: "row",
      label: "Amount",
      value: (
        <AmountWithUsd
          symbol={coinSymbol}
          balance={transaction.amount}
          usdBalance={usdPrice * transaction.amount}
          isLoadingUsdPrice={isLoading}
          decimals={decimals}
        />
      ),
    },
  ];

  const ActionBanner =
    transaction.status === TransactionStatus.Invalid
      ? FailedActionBanner
      : SuccessActionBanner;

  return (
    <DialogContent
      sx={{
        padding: "20px!important",
        rowGap: 1.6,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <ActionBanner
        label={`Transaction ${wasReceived ? "Received" : "Sent"}${
          transaction.status === TransactionStatus.Invalid ? " but Failed" : ""
        }`}
      />
      <Summary rows={firstSummaryRow} />
      <Summary rows={rows} />
      <Summary rows={getTxSummaryRows(transaction)} />
    </DialogContent>
  );
}

interface TransactionDetailModalProps {
  transaction: Transaction;
  onClose: () => void;
}

export default function TransactionDetailModal({
  transaction: transactionFromProps,
  onClose,
}: TransactionDetailModalProps) {
  const lastTxRef = useRef<Transaction>(null);

  useEffect(() => {
    if (transactionFromProps) {
      lastTxRef.current = transactionFromProps;
    } else {
      setTimeout(() => {
        lastTxRef.current = null;
      }, 150);
    }
  }, [transactionFromProps]);

  const transaction = transactionFromProps || lastTxRef.current;

  let contentComponent: React.ReactNode;

  if (
    transaction?.protocol === SupportedProtocols.Pocket &&
    !!transaction.type &&
    transaction.type !== PocketNetworkTransactionTypes.Send
  ) {
    contentComponent = <PoktTransactionDetailModal transaction={transaction} />;
  } else if (transaction) {
    contentComponent = <Content transaction={transaction} />;
  }

  return (
    <BaseDialog
      open={!!transactionFromProps}
      title={"Transaction"}
      onClose={onClose}
      isLoading={false}
    >
      {contentComponent}
      <DialogActions sx={{ height: 56, padding: 0 }}>
        <DialogButtons
          primaryButtonProps={{ children: "Done", onClick: onClose }}
        />
      </DialogActions>
    </BaseDialog>
  );
}
