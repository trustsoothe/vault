import type { SnackbarKey } from "notistack";
import map from "lodash/map";
import groupBy from "lodash/groupBy";
import orderBy from "lodash/orderBy";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import Skeleton from "@mui/material/Skeleton";
import Typography from "@mui/material/Typography";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { SupportedProtocols } from "@poktscan/vault";
import { selectedAccountAddressSelector } from "../../redux/selectors/account";
import { transactionsSelector } from "../../redux/slices/app/transactions";
import { enqueueErrorSnackbar, roundAndSeparate } from "../../utils/ui";
import { Transaction } from "../../controllers/datasource/Transaction";
import MintTransactionModal from "../Transaction/MintTransactionModal";
import { Status } from "../../components/Account/WrappedPoktTxs";
import useSelectedAsset from "../Home/hooks/useSelectedAsset";
import TransactionDetailModal from "./TransactionDetailModal";
import ActivityIcon from "../assets/img/activity_logo.svg";
import ReceivedIcon from "../assets/img/receive_icon.svg";
import SentIcon from "../assets/img/sent_icon.svg";
import { useAppSelector } from "../../hooks/redux";
import useUsdPrice from "../hooks/useUsdPrice";
import {
  selectedChainSelector,
  selectedProtocolSelector,
} from "../../redux/selectors/network";
import { themeColors } from "../theme";

export interface MintTransaction {
  _id: string;
  transaction_hash: string;
  confirmations: string;
  sender_address: string;
  sender_chain_id: string;
  recipient_address: string;
  recipient_chain_id: string;
  wpokt_address: string;
  amount: string;
  status: Status;
  signers: string[];
  created_at: string;
  updated_at: string;
  height: string;
  vault_address: string;
  nonce: string;
  memo: {
    address: string;
    chain_id: string;
  };
  data: {
    recipient: string;
    amount: string;
    nonce: string;
  };
  signatures: string[];
  mint_tx_hash: string;
}

interface TransactionItemProps {
  transaction: Transaction | MintTransaction;
  shortTransaction: {
    from: string;
    protocol: SupportedProtocols;
    chainId: string;
    amount: number;
    timestamp: number;
    shouldMint?: boolean;
  };
  openTransactionDetail: (transaction: Transaction | MintTransaction) => void;
}

function TransactionItem({
  transaction: fullTransaction,
  shortTransaction: transaction,
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

  const time = new Date(transaction.timestamp).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });

  const pendingMint =
    transaction.shouldMint &&
    "status" in fullTransaction &&
    fullTransaction.status === Status.SIGNED;

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
      onClick={() => openTransactionDetail(fullTransaction)}
    >
      <Stack
        width={1}
        height={50}
        spacing={1.2}
        direction={"row"}
        alignItems={"center"}
        position={"relative"}
      >
        <Icon />
        {pendingMint && (
          <Stack
            width={9}
            height={9}
            borderRadius={"50%"}
            position={"absolute"}
            bgcolor={themeColors.intense_red}
            border={`2px solid ${themeColors.white}`}
            margin={"0px!important"}
            left={23}
            bottom={29}
          />
        )}
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
              {pendingMint ? "Pending Mint" : time}
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

const MAINNET_BASE_API_URL = process.env.WPOKT_MAINNET_API_BASE_URL;
const TESTNET_BASE_API_URL = process.env.WPOKT_TESTNET_API_BASE_URL;

export default function Activity() {
  const errorSnackbarKeyRef = useRef<SnackbarKey>(null);
  const abortControllerRef = useRef<AbortController>(null);
  const [txToDetail, setTxToDetail] = useState<Transaction>(null);
  const [txToMin, setTxToMint] = useState<MintTransaction>(null);
  const selectedChain = useAppSelector(selectedChainSelector);
  const transactions = useAppSelector(transactionsSelector);
  const selectedAsset = useSelectedAsset();
  const selectedProtocol = useAppSelector(selectedProtocolSelector);
  const selectedAccountAddress = useAppSelector(selectedAccountAddressSelector);

  const wPoktTxApiBaseUrl =
    selectedAsset?.symbol === "WPOKT"
      ? selectedChain === "1"
        ? MAINNET_BASE_API_URL
        : TESTNET_BASE_API_URL
      : undefined;

  const [isLoadingMints, setIsLoadingMints] = useState(!!wPoktTxApiBaseUrl);
  const [mintTransactions, setMintTransactions] = useState<
    Array<MintTransaction>
  >([]);

  const fetchMintTransactions = () => {
    abortControllerRef.current = new AbortController();
    return fetch(
      `${wPoktTxApiBaseUrl}/mints/active?recipient=${selectedAccountAddress}`,
      {
        signal: abortControllerRef.current.signal,
      }
    )
      .then((res) => res.json())
      .then((items: Array<MintTransaction>) => {
        setMintTransactions(items);
        setIsLoadingMints(false);
      })
      .catch(() => {
        errorSnackbarKeyRef.current = enqueueErrorSnackbar({
          message: `Failed to fetch Mint Transactions`,
          onRetry: fetchMintTransactions,
        });
      })
      .finally(() => (abortControllerRef.current = null));
  };

  useEffect(() => {
    if (!wPoktTxApiBaseUrl) return;
    setIsLoadingMints(true);

    let interval: NodeJS.Timeout;
    fetchMintTransactions().then(() => {
      interval = setInterval(fetchMintTransactions, 60000);
    });

    return () => {
      clearInterval(interval);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [selectedAccountAddress, wPoktTxApiBaseUrl]);

  const { transactionsGroupedByDay, idOfPendingMint } = useMemo(() => {
    const txs = transactions.filter(
      (t) =>
        t.protocol === selectedProtocol &&
        t.chainId === selectedChain &&
        (t.from === selectedAccountAddress ||
          t.to === selectedAccountAddress) &&
        (t.protocol !== SupportedProtocols.Ethereum ||
          t.assetId === selectedAsset?.id)
    );

    const idOfPendingMint =
      orderBy(
        mintTransactions
          .filter((tx) => tx.status === Status.SIGNED)
          .map((tx: MintTransaction) => ({
            ...tx,
            nonce: Number(tx.nonce),
          })),
        ["nonce"],
        ["asc"]
      )[0]?._id || null;

    const transactionsGroupedByDay = orderBy(
      map(
        groupBy([...txs, ...mintTransactions], (t) => {
          const date = new Date("created_at" in t ? t.created_at : t.timestamp);

          return `${date.toLocaleDateString(undefined, {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })}`;
        }),
        (transactions, day) => {
          const transactionsOrdered = orderBy(
            transactions,
            (t) => {
              if ("created_at" in t) {
                return new Date(t.created_at).getTime();
              }

              return t.timestamp;
            },
            ["desc"]
          );

          const firstTx = transactionsOrdered.at(0);

          const date = new Date(
            "created_at" in firstTx ? firstTx.created_at : firstTx.timestamp
          );

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

    return { transactionsGroupedByDay, idOfPendingMint };
  }, [
    transactions,
    selectedAsset?.id,
    selectedProtocol,
    selectedChain,
    selectedAccountAddress,
    mintTransactions,
  ]);

  const openTxDetail = (transaction: Transaction | MintTransaction) => {
    if ("_id" in transaction) {
      setTxToMint(transaction);
    } else {
      setTxToDetail(transaction);
    }
  };
  const closeTxDetail = () => {
    setTxToDetail(null);
  };
  const closeTxToMin = () => {
    setTxToMint(null);
  };

  const hasTransactions = transactionsGroupedByDay.length > 0;

  return (
    <>
      <TransactionDetailModal
        transaction={txToDetail}
        onClose={closeTxDetail}
      />
      <MintTransactionModal
        mintTransaction={txToMin}
        onClose={closeTxToMin}
        idOfTxToMint={idOfPendingMint}
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
              {isLoadingMints
                ? "Loading Pending Mints"
                : "Your account has no recorded activity to show yet."}
            </Typography>
          </>
        ) : (
          transactionsGroupedByDay.map(({ day, transactions }) => (
            <Stack spacing={0.8} key={day}>
              <RenderDay day={day} />
              {transactions.map((transaction) => {
                let shortTransaction: TransactionItemProps["shortTransaction"];

                if ("_id" in transaction) {
                  shortTransaction = {
                    from: transaction.sender_address,
                    protocol: selectedProtocol,
                    chainId: selectedChain,
                    amount: Number(transaction.amount) / 1e6,
                    timestamp: new Date(transaction.created_at).getTime(),
                    shouldMint: idOfPendingMint === transaction._id,
                  };
                } else {
                  shortTransaction = {
                    from: transaction.from,
                    protocol: transaction.protocol,
                    chainId: transaction.chainId,
                    amount: transaction.amount,
                    timestamp: transaction.timestamp,
                  };
                }

                return (
                  <TransactionItem
                    key={
                      "_id" in transaction ? transaction._id : transaction.hash
                    }
                    transaction={transaction}
                    shortTransaction={shortTransaction}
                    openTransactionDetail={openTxDetail}
                  />
                );
              })}
            </Stack>
          ))
        )}
      </Stack>
    </>
  );
}
