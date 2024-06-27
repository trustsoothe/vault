import map from "lodash/map";
import groupBy from "lodash/groupBy";
import orderBy from "lodash/orderBy";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import Skeleton from "@mui/material/Skeleton";
import React, { useMemo, useState } from "react";
import Typography from "@mui/material/Typography";
import { SupportedProtocols } from "@poktscan/vault";
import { selectedAccountAddressSelector } from "../../redux/selectors/account";
import { transactionsSelector } from "../../redux/slices/app/transactions";
import { Transaction } from "../../controllers/datasource/Transaction";
import useSelectedAsset from "../Home/hooks/useSelectedAsset";
import TransactionDetailModal from "./TransactionDetailModal";
import ActivityIcon from "../assets/img/activity_logo.svg";
import ReceivedIcon from "../assets/img/receive_icon.svg";
import SentIcon from "../assets/img/sent_icon.svg";
import { useAppSelector } from "../../hooks/redux";
import { roundAndSeparate } from "../../utils/ui";
import useUsdPrice from "../hooks/useUsdPrice";
import {
  selectedChainSelector,
  selectedProtocolSelector,
} from "../../redux/selectors/network";
import { themeColors } from "../theme";

interface TransactionItemProps {
  transaction: Transaction;
  openTransactionDetail: (transaction: Transaction) => void;
}

function TransactionItem({
  transaction,
  openTransactionDetail,
}: TransactionItemProps) {
  const asset = useSelectedAsset();
  const selectedAccountAddress = useAppSelector(selectedAccountAddressSelector);

  const wasReceived = selectedAccountAddress !== transaction.from;
  const Icon = wasReceived ? ReceivedIcon : SentIcon;

  const { coinSymbol, usdPrice, isLoading, error } = useUsdPrice({
    protocol: transaction.protocol,
    chainId: transaction.chainId,
    asset,
  });

  return (
    <Button
      sx={{
        width: 1,
        height: 50,
        paddingY: 0.8,
        fontWeight: 400,
        paddingLeft: 0.4,
        paddingRight: 0.6,
        borderRadius: "8px",
        backgroundColor: themeColors.white,
      }}
      onClick={() => openTransactionDetail(transaction)}
    >
      <Stack
        width={1}
        height={50}
        spacing={1.2}
        direction={"row"}
        alignItems={"center"}
      >
        <Icon />
        <Stack spacing={0.4} flexGrow={1}>
          <Stack
            width={1}
            spacing={0.5}
            direction={"row"}
            alignItems={"center"}
            justifyContent={"space-between"}
          >
            <Typography
              lineHeight={"16px"}
              variant={"subtitle2"}
              color={themeColors.black}
            >
              {wasReceived ? "Received" : "Sent"}
            </Typography>
            <Stack direction={"row"} alignItems={"center"} spacing={0.5}>
              <Typography
                lineHeight={"16px"}
                variant={"subtitle2"}
                color={themeColors.black}
                noWrap={true}
              >
                {wasReceived ? "+" : "-"}
                {roundAndSeparate(
                  transaction.amount,
                  asset?.decimals ||
                    transaction.protocol === SupportedProtocols.Ethereum
                    ? 18
                    : 6,
                  "0.00"
                )}
              </Typography>
              <Typography
                variant={"subtitle2"}
                lineHeight={"16px"}
                color={themeColors.black}
              >
                {coinSymbol}
              </Typography>
            </Stack>
          </Stack>
          <Stack
            width={1}
            spacing={0.5}
            direction={"row"}
            alignItems={"center"}
            justifyContent={"space-between"}
          >
            <Typography
              variant={"body2"}
              lineHeight={"14px"}
              color={themeColors.textSecondary}
            >
              {new Date(transaction.timestamp).toLocaleTimeString(undefined, {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Typography>
            {isLoading ? (
              <Skeleton variant={"rectangular"} width={50} height={14} />
            ) : (
              <Typography
                variant={"body2"}
                lineHeight={"14px"}
                color={themeColors.textSecondary}
              >
                {wasReceived ? "+" : "-"}${" "}
                {error
                  ? "-"
                  : roundAndSeparate(transaction.amount * usdPrice, 2, "0.00")}
              </Typography>
            )}
          </Stack>
        </Stack>
      </Stack>
    </Button>
  );
}

function RenderDay({ day }: { day: string }) {
  return (
    <Typography
      paddingX={1}
      fontSize={11}
      paddingY={0.5}
      lineHeight={"14px"}
      borderRadius={"6px"}
      bgcolor={themeColors.bgLightGray}
    >
      {day}
    </Typography>
  );
}

export default function Activity() {
  const [txToDetail, setTxToDetail] = useState<Transaction>(null);
  const selectedChain = useAppSelector(selectedChainSelector);
  const transactions = useAppSelector(transactionsSelector);
  const selectedAsset = useSelectedAsset();
  const selectedProtocol = useAppSelector(selectedProtocolSelector);
  const selectedAccountAddress = useAppSelector(selectedAccountAddressSelector);

  const openTxDetail = (transaction: Transaction) => setTxToDetail(transaction);
  const closeTxDetail = () => {
    setTxToDetail(null);
  };

  const transactionsGroupedByDay = useMemo(() => {
    const txs = transactions.filter(
      (t) =>
        t.protocol === selectedProtocol &&
        t.chainId === selectedChain &&
        (t.from === selectedAccountAddress ||
          t.to === selectedAccountAddress) &&
        (t.protocol !== SupportedProtocols.Ethereum ||
          t.assetId === selectedAsset?.id)
    );

    return orderBy(
      map(
        groupBy(txs, (t) => {
          const date = new Date(t.timestamp);

          return `${date.toLocaleDateString(undefined, {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })}`;
        }),
        (transactions, day) => {
          const transactionsOrdered = orderBy(
            transactions,
            ["timestamp"],
            ["desc"]
          );
          const date = new Date(transactionsOrdered.at(0).timestamp);

          return {
            date,
            transactions: transactionsOrdered,
            day,
          };
        }
      ),
      ["date"],
      ["desc"]
    );
  }, [
    transactions,
    selectedAsset?.id,
    selectedProtocol,
    selectedChain,
    selectedAccountAddress,
  ]);

  const hasTransactions = transactionsGroupedByDay.length > 0;

  return (
    <>
      <TransactionDetailModal
        transaction={txToDetail}
        onClose={closeTxDetail}
      />
      <Stack
        flexGrow={1}
        spacing={1.6}
        padding={2.4}
        minHeight={0}
        flexBasis={"1px"}
        overflow={"auto"}
        bgcolor={themeColors.white}
        {...(!hasTransactions && {
          alignItems: "center",
          paddingTop: 3.9,
          spacing: 0.5,
        })}
      >
        {!hasTransactions ? (
          <>
            <ActivityIcon />
            <Typography width={220} textAlign={"center"}>
              Your account has no recorded activity to show yet.
            </Typography>
          </>
        ) : (
          transactionsGroupedByDay.map(({ day, transactions }) => (
            <Stack spacing={0.8}>
              <RenderDay day={day} />
              {transactions.map((transaction) => (
                <TransactionItem
                  key={transaction.hash}
                  transaction={transaction}
                  openTransactionDetail={openTxDetail}
                />
              ))}
            </Stack>
          ))
        )}
      </Stack>
    </>
  );
}
