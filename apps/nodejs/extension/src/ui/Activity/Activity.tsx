import map from "lodash/map";
import groupBy from "lodash/groupBy";
import orderBy from "lodash/orderBy";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import Skeleton from "@mui/material/Skeleton";
import Typography from "@mui/material/Typography";
import { closeSnackbar, SnackbarKey } from "notistack";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  CosmosTransactionTypes,
  PocketNetworkTransactionTypes,
  SupportedProtocols,
} from "@soothe/vault";
import { transactionsSelector } from "../../redux/slices/app/transactions";
import { enqueueErrorSnackbar, roundAndSeparate } from "../../utils/ui";
import {
  PoktTransaction,
  Transaction,
} from "../../controllers/datasource/Transaction";
import MintTransactionModal from "../Transaction/MintTransactionModal";
import { AccountInfoFromAddress } from "../components/AccountInfo";
import { contactsSelector } from "../../redux/selectors/contact";
import useSelectedAsset from "../Home/hooks/useSelectedAsset";
import TransactionDetailModal from "./TransactionDetailModal";
import ActivityIcon from "../assets/img/activity_logo.svg";
import ReceivedIcon from "../assets/img/receive_icon.svg";
import SentIcon from "../assets/img/sent_icon.svg";
import { useAppSelector } from "../hooks/redux";
import useUsdPrice from "../hooks/useUsdPrice";
import {
  accountsSelector,
  selectedAccountAddressSelector,
} from "../../redux/selectors/account";
import {
  selectedChainSelector,
  selectedProtocolSelector,
} from "../../redux/selectors/network";
import { themeColors } from "../theme";
import {
  MintTransaction,
  TxStatus,
  useLazyGetActiveMintsQuery,
} from "../../redux/slices/wpokt";
import { getAddressFromPublicKey } from "../../utils/networkOperations";
import { getTransactionTypeLabel } from "../Request/PoktTransactionRequest";

interface TransactionItemProps {
  transaction: Transaction | MintTransaction;
  shortTransaction: {
    from: string;
    protocol: SupportedProtocols;
    chainId: string;
    amount: number;
    timestamp: number;
    shouldMint?: boolean;
    otherAccount?: { address: string; name?: string; isContact: boolean };
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
    fullTransaction.status === TxStatus.SIGNED;

  return (
    <Button
      sx={{
        width: 1,
        height: 74,
        paddingY: 0.8,
        fontWeight: 400,
        paddingLeft: 0.4,
        paddingRight: 0.6,
        borderRadius: "8px",
        color: themeColors.black,
        backgroundColor: themeColors.white,
      }}
      onClick={() => openTransactionDetail(fullTransaction)}
    >
      <Stack
        width={1}
        height={74}
        spacing={1.2}
        direction={"row"}
        alignItems={"center"}
        position={"relative"}
        sx={{
          "& svg.tx_type": {
            minWidth: 34,
            minHeight: 34,
          },
          "& div.avatar": {
            width: 12,
            height: 12,
            marginRight: -0.3,
          },
          "& svg.avatar": {
            marginTop: 0.1,
            transform: "scale(0.8)",
            marginRight: -0.3,
          },
        }}
      >
        <Icon className={"tx_type"} />
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
            top={18}
          />
        )}
        <Stack spacing={0.4} flexGrow={1}>
          <Stack
            width={1}
            spacing={1.5}
            direction={"row"}
            alignItems={"center"}
            justifyContent={"space-between"}
          >
            <Typography
              lineHeight={"16px"}
              variant={"subtitle2"}
              color={themeColors.black}
            >
              {"protocol" in fullTransaction &&
              fullTransaction.protocol === SupportedProtocols.Cosmos &&
              fullTransaction.type === CosmosTransactionTypes.ClaimAccount
                ? "Migration"
                : wasReceived
                ? "Received"
                : "Sent"}
            </Typography>
            <Stack
              direction={"row"}
              alignItems={"center"}
              spacing={0.5}
              width={212}
              justifyContent={"flex-end"}
            >
              <Typography
                lineHeight={"16px"}
                variant={"subtitle2"}
                color={themeColors.black}
                noWrap={true}
              >
                {transaction.amount ? (wasReceived ? "+" : "-") : ""}
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
              {isLoading ? (
                <Skeleton variant={"rectangular"} width={50} height={14} />
              ) : (
                <Typography
                  variant={"body2"}
                  lineHeight={"16px"}
                  whiteSpace={"nowrap"}
                  color={themeColors.textSecondary}
                >
                  ($
                  {error
                    ? "-"
                    : roundAndSeparate(
                        transaction.amount * usdPrice,
                        2,
                        "0.00"
                      )}
                  )
                </Typography>
              )}
            </Stack>
          </Stack>
          <Stack
            width={1}
            spacing={1}
            direction={"row"}
            alignItems={"center"}
            justifyContent={"space-between"}
          >
            <Typography
              lineHeight={"16px"}
              variant={"subtitle2"}
              color={themeColors.black}
            >
              {wasReceived ? "Sender" : "Recipient"}
            </Typography>
            <AccountInfoFromAddress
              address={transaction.otherAccount.address}
              protocol={transaction.protocol}
            />
          </Stack>
          <Stack width={1} direction={"row"} alignItems={"center"}>
            <Typography
              variant={"body2"}
              lineHeight={"14px"}
              color={themeColors.textSecondary}
            >
              {pendingMint ? "Pending Mint" : time}
            </Typography>
          </Stack>
        </Stack>
      </Stack>
    </Button>
  );
}

function AccountFromPublicKey({ publicKey }: { publicKey: string }) {
  const [address, setAddress] = useState("");

  useEffect(() => {
    getAddressFromPublicKey(publicKey).then(setAddress);
  }, [publicKey]);

  if (!address) return null;

  return (
    <AccountInfoFromAddress
      address={address}
      protocol={SupportedProtocols.Pocket}
    />
  );
}

interface PoktTransactionItem {
  transaction: PoktTransaction;
  openTransactionDetail: (transaction: Transaction | MintTransaction) => void;
}

function PoktTransactionItem({
  transaction,
  openTransactionDetail,
}: PoktTransactionItem) {
  const { coinSymbol, usdPrice, isLoading, error } = useUsdPrice({
    protocol: transaction.protocol,
    chainId: transaction.chainId,
  });

  const amountComponent = (
    <Stack
      direction={"row"}
      alignItems={"center"}
      spacing={0.5}
      justifyContent={"flex-end"}
    >
      <Typography
        lineHeight={"16px"}
        variant={"subtitle2"}
        color={themeColors.black}
        noWrap={true}
      >
        {roundAndSeparate(transaction.amount, 6, "0.00")}
      </Typography>
      <Typography
        variant={"subtitle2"}
        lineHeight={"16px"}
        color={themeColors.black}
      >
        {coinSymbol}
      </Typography>
      {isLoading ? (
        <Skeleton variant={"rectangular"} width={50} height={14} />
      ) : (
        <Typography
          variant={"body2"}
          lineHeight={"16px"}
          whiteSpace={"nowrap"}
          color={themeColors.textSecondary}
        >
          ($
          {error
            ? "-"
            : roundAndSeparate(transaction.amount * usdPrice, 2, "0.00")}
          )
        </Typography>
      )}
    </Stack>
  );

  let components: [React.ReactNode, React.ReactNode, React.ReactNode];

  switch (transaction.type) {
    case PocketNetworkTransactionTypes.NodeStake: {
      components = [
        amountComponent,
        "Node",
        transaction.transactionParams.nodePublicKey ? (
          <AccountFromPublicKey
            publicKey={transaction.transactionParams.nodePublicKey}
          />
        ) : (
          <AccountInfoFromAddress
            address={transaction.from}
            protocol={transaction.protocol}
          />
        ),
      ];
      break;
    }
    case PocketNetworkTransactionTypes.NodeUnjail:
    case PocketNetworkTransactionTypes.NodeUnstake: {
      components = [
        null,
        "Node",
        <AccountInfoFromAddress
          address={transaction.from}
          protocol={transaction.protocol}
        />,
      ];
      break;
    }
    case PocketNetworkTransactionTypes.AppStake: {
      components = [
        amountComponent,
        "App",
        <AccountFromPublicKey
          publicKey={transaction.transactionParams.appPublicKey}
        />,
      ];
      break;
    }
    case PocketNetworkTransactionTypes.AppTransfer: {
      components = [
        null,
        "To",
        <AccountFromPublicKey
          publicKey={transaction.transactionParams.appPublicKey}
        />,
      ];
      break;
    }
    case PocketNetworkTransactionTypes.AppUnstake: {
      components = [
        null,
        "App",
        <AccountInfoFromAddress
          address={transaction.transactionParams.appAddress}
          protocol={transaction.protocol}
        />,
      ];
      break;
    }
    case PocketNetworkTransactionTypes.GovChangeParam: {
      components = [null, "Param", transaction.transactionParams.paramKey];
      break;
    }
    case PocketNetworkTransactionTypes.GovDAOTransfer: {
      const isTransfer =
        transaction.transactionParams.daoAction === "dao_transfer";
      components = [
        amountComponent,
        isTransfer ? "Transfer to" : "Burn",
        isTransfer ? (
          <AccountInfoFromAddress
            address={transaction.transactionParams.to}
            protocol={transaction.protocol}
          />
        ) : null,
      ];
      break;
    }
    case PocketNetworkTransactionTypes.GovUpgrade: {
      const { version, features, height } =
        transaction.transactionParams.upgrade;
      const upgradingFeature = version === "FEATURE";

      components = [
        null,
        upgradingFeature ? "Features" : "Version",
        upgradingFeature
          ? features.length > 1
            ? `${features.length} Features`
            : features.at(0).split(":").at(0)
          : transaction.transactionParams.upgrade.version,
      ];
      break;
    }
  }

  const time = new Date(transaction.timestamp).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Button
      sx={{
        width: 1,
        height: 74,
        paddingY: 0.8,
        fontWeight: 400,
        paddingLeft: 0.4,
        paddingRight: 0.6,
        borderRadius: "8px",
        color: themeColors.black,
        backgroundColor: themeColors.white,
      }}
      onClick={() => openTransactionDetail(transaction)}
    >
      <Stack
        width={1}
        height={74}
        spacing={1.2}
        direction={"row"}
        alignItems={"center"}
        position={"relative"}
        sx={{
          "& svg.tx_type": {
            minWidth: 34,
            minHeight: 34,
          },
          "& div.avatar": {
            width: 12,
            height: 12,
            marginRight: -0.3,
          },
          "& svg.avatar": {
            marginTop: 0.1,
            transform: "scale(0.8)",
            marginRight: -0.3,
          },
        }}
      >
        <SentIcon className={"tx_type"} />
        <Stack spacing={0.4} flexGrow={1}>
          <Stack
            width={1}
            spacing={1.5}
            direction={"row"}
            alignItems={"center"}
            justifyContent={"space-between"}
          >
            <Typography
              lineHeight={"16px"}
              variant={"subtitle2"}
              color={themeColors.black}
            >
              {getTransactionTypeLabel(transaction.type)}
            </Typography>
            {components[0]}
          </Stack>
          <Stack
            width={1}
            spacing={1}
            direction={"row"}
            alignItems={"center"}
            justifyContent={"space-between"}
          >
            <Typography
              lineHeight={"16px"}
              variant={"subtitle2"}
              color={themeColors.black}
            >
              {components[1]}
            </Typography>
            {components[2]}
          </Stack>
          <Stack width={1} direction={"row"} alignItems={"center"}>
            <Typography
              variant={"body2"}
              lineHeight={"14px"}
              color={themeColors.textSecondary}
            >
              {time}
            </Typography>
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
  const errorSnackbarKeyRef = useRef<SnackbarKey>(null);
  const [txToDetail, setTxToDetail] = useState<Transaction>(null);
  const [txToMin, setTxToMint] = useState<MintTransaction>(null);
  const selectedChain = useAppSelector(selectedChainSelector);
  const transactions = useAppSelector(transactionsSelector);
  const selectedAsset = useSelectedAsset();
  const selectedProtocol = useAppSelector(selectedProtocolSelector);
  const selectedAccountAddress = useAppSelector(selectedAccountAddressSelector);
  const accounts = useAppSelector(accountsSelector);
  const contacts = useAppSelector(contactsSelector);

  const [
    fetchActiveMints,
    { data: rawMintTransactions, isLoading: isLoadingMints },
  ] = useLazyGetActiveMintsQuery({
    pollingInterval: 60000,
  });

  const mustShowMintTransactions = selectedAsset?.symbol === "WPOKT";

  const closeSnackbars = () => {
    if (errorSnackbarKeyRef.current) {
      closeSnackbar(errorSnackbarKeyRef.current);
      errorSnackbarKeyRef.current = null;
    }
  };

  useEffect(() => {
    if (mustShowMintTransactions) {
      fetchActiveMints(
        {
          recipient: selectedAccountAddress,
          chain: selectedChain === "1" ? "mainnet" : "testnet",
        },
        true
      ).then((res) => {
        if (res.isError) {
          errorSnackbarKeyRef.current = enqueueErrorSnackbar({
            message: `Failed to fetch Mint Transactions`,
            onRetry: () =>
              fetchActiveMints(
                {
                  recipient: selectedAccountAddress,
                  chain: selectedChain === "1" ? "mainnet" : "testnet",
                },
                true
              ),
          });
        } else {
          closeSnackbars();
        }
      });
    }

    return closeSnackbars;
  }, [mustShowMintTransactions, selectedAccountAddress]);

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

    const mintTransactions = rawMintTransactions || [];

    const idOfPendingMint =
      orderBy(
        mintTransactions
          .filter((tx) => tx.status === TxStatus.SIGNED)
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
        (
          transactions: Array<
            (Transaction | MintTransaction) & {
              otherAccount: TransactionItemProps["shortTransaction"]["otherAccount"];
            }
          >,
          day
        ) => {
          const transactionsOrdered = orderBy(
            transactions,
            (t) => {
              if ("created_at" in t) {
                let fromContacts = false;
                const sender =
                  contacts.find((account) => {
                    if (
                      account.address === t.sender_address &&
                      account.protocol === selectedProtocol
                    ) {
                      fromContacts = true;
                      return true;
                    }

                    return false;
                  }) ||
                  accounts.find(
                    (account) =>
                      account.address === t.sender_address &&
                      account.protocol === selectedProtocol
                  );

                t.otherAccount = {
                  address: sender?.address || t.sender_address,
                  name: sender?.name,
                  isContact: fromContacts,
                };
                return new Date(t.created_at).getTime();
              }

              const otherAccountAddress =
                t.to === selectedAccountAddress
                  ? t.from
                  : t.swapTo?.address || t.to;

              let fromContacts = false;
              const otherAccount =
                contacts.find((account) => {
                  if (
                    account.address === otherAccountAddress &&
                    account.protocol === selectedProtocol
                  ) {
                    fromContacts = true;
                    return true;
                  }

                  return false;
                }) ||
                accounts.find(
                  (account) =>
                    account.address === otherAccountAddress &&
                    account.protocol === selectedProtocol
                );

              t.otherAccount = {
                address: otherAccount?.address || otherAccountAddress,
                name: otherAccount?.name,
                isContact: fromContacts,
              };

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
    rawMintTransactions,
    contacts,
    accounts,
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
              {isLoadingMints && mustShowMintTransactions
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
                    otherAccount: transaction.otherAccount,
                  };
                } else {
                  shortTransaction = {
                    from: transaction.from,
                    protocol: transaction.protocol,
                    chainId: transaction.chainId,
                    amount: transaction.amount,
                    timestamp: transaction.timestamp,
                    otherAccount: transaction.otherAccount,
                  };
                }

                if (
                  "hash" in transaction &&
                  transaction.protocol === SupportedProtocols.Pocket &&
                  transaction.type &&
                  transaction.type !== PocketNetworkTransactionTypes.Send
                ) {
                  return (
                    <PoktTransactionItem
                      key={transaction.hash}
                      transaction={transaction}
                      openTransactionDetail={openTxDetail}
                    />
                  );
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
