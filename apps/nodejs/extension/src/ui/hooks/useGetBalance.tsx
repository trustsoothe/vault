import type { QueryState } from "@reduxjs/toolkit/dist/query/core/apiState";
import Stack from "@mui/material/Stack";
import { shallowEqual } from "react-redux";
import Typography from "@mui/material/Typography";
import type { SupportedProtocols } from "@soothe/vault";
import React, { useEffect, useMemo, useReducer, useRef } from "react";
import { closeSnackbar, SnackbarKey } from "notistack";
import useDidMountEffect from "./useDidMountEffect";
import { enqueueErrorSnackbar } from "../../utils/ui";
import {
  balanceApi,
  BalanceQueryError,
  GetAccountBalanceArg,
  useGetBalanceQuery,
} from "../../redux/slices/balance";
import { useAppDispatch, useAppSelector } from "./redux";
import {
  isBalanceDisabledSelector,
  networksSelector,
} from "../../redux/selectors/network";
import { labelByProtocolMap } from "../../constants/protocols";
import type { RootState } from "../../redux/store";
import { themeColors } from "../theme";
import getStore, { STORE_RECONNECTED_EVENT } from "../store";
import { pendingOutgoingSelector } from "../../redux/selectors/app";
import {
  PendingOutgoingTransaction,
  removePendingOutgoing,
} from "../../redux/slices/app";

const snackbarKey = "fetch_balance_failed";

const ERROR_WINDOW_MS = 1000 * 60;

interface FailedBalanceGroup {
  key: string;
  label: string;
  accounts: number;
  message?: string;
}

function getFailedBalanceQueries(state: RootState) {
  return Object.values(state.balanceApi.queries).filter(
    (item) =>
      item.status === "rejected" &&
      item.startedTimeStamp >= Date.now() - ERROR_WINDOW_MS
  );
}

function groupFailedQueriesByNetwork(
  queries: ReturnType<typeof getFailedBalanceQueries>,
  networks: RootState["app"]["networks"]
): Array<FailedBalanceGroup> {
  const groups = new Map<
    string,
    FailedBalanceGroup & { addresses: Set<string> }
  >();

  for (const query of queries) {
    const args = query.originalArgs as GetAccountBalanceArg | undefined;
    if (!args) continue;

    const key = `${args.protocol}-${args.chainId}`;
    const network = networks.find(
      (item) => item.protocol === args.protocol && item.chainId === args.chainId
    );
    const error = query.error as BalanceQueryError | undefined;

    let group = groups.get(key);
    if (!group) {
      group = {
        key,
        label:
          network?.label ||
          `${labelByProtocolMap[args.protocol] || args.protocol} (${
            args.chainId
          })`,
        accounts: 0,
        message: error?.message,
        addresses: new Set(),
      };
      groups.set(key, group);
    }

    group.addresses.add(args.address);
    group.accounts = group.addresses.size;
    if (!group.message && error?.message) {
      group.message = error.message;
    }
  }

  return Array.from(groups.values()).map(({ addresses, ...group }) => group);
}

// here we want to display, grouped by network, the account balances that
// thrown an error in the last minute
function AccountsWithBalanceError() {
  const networks = useAppSelector(networksSelector);
  const failedQueries = useAppSelector(getFailedBalanceQueries, shallowEqual);
  // the "last minute" window depends on the current time, so we re-evaluate
  // it periodically even if the store does not change
  const [, forceRender] = useReducer((x: number) => x + 1, 0);

  useEffect(() => {
    if (failedQueries.length === 0) {
      closeSnackbar(snackbarKey);
      return;
    }

    const interval = setInterval(forceRender, 1000);

    return () => clearInterval(interval);
  }, [failedQueries]);

  const groups = useMemo(
    () => groupFailedQueriesByNetwork(failedQueries, networks),
    [failedQueries, networks]
  );

  return (
    <Stack marginBottom={"4px!important"} spacing={0.25}>
      <Typography color={themeColors.white} fontWeight={500}>
        Balance fetch failed
      </Typography>
      {groups.map((group) => (
        <Typography
          key={group.key}
          color={themeColors.bgLightGray}
          fontSize={11}
          lineHeight={"15px"}
        >
          <strong>{group.label}</strong>: {group.accounts} account
          {group.accounts > 1 && "s"}
          {group.message ? ` — ${group.message}` : ""}
        </Typography>
      ))}
    </Stack>
  );
}

/** a pending outgoing transaction is forgotten after this time no matter what */
const PENDING_OUTGOING_TTL_MS = 1000 * 60 * 10;
// tolerance when comparing balances (float arithmetic on coin units)
const BALANCE_EPSILON = 1e-9;

/** whether a pending outgoing transaction affects the balance of this query */
function appliesToBalance(
  tx: PendingOutgoingTransaction,
  {
    address,
    chainId,
    protocol,
    asset,
  }: Pick<UseGetBalance, "address" | "chainId" | "protocol" | "asset">
) {
  if (
    tx.address !== address ||
    tx.chainId !== chainId ||
    tx.protocol !== protocol
  ) {
    return false;
  }

  // asset balance: only transfers of that asset count
  if (asset) {
    return tx.assetContractAddress === asset.contractAddress;
  }

  // native balance: native transfers (amount + fee) and fees of asset transfers
  return true;
}

/** amount a pending outgoing transaction takes from the balance of this query */
function pendingAmountOf(tx: PendingOutgoingTransaction, isAsset: boolean) {
  if (isAsset) return tx.amount;
  return tx.assetContractAddress ? tx.fee : tx.amount + tx.fee;
}

/**
 * A pending outgoing transaction is over once the balance it was debited from
 * dropped (the transaction was applied) or it is too old.
 */
function isPendingOutgoingDone(
  tx: PendingOutgoingTransaction,
  currentBalance: number | undefined,
  now: number
) {
  if (now - tx.createdAt > PENDING_OUTGOING_TTL_MS) return true;
  if (currentBalance === undefined) return false;
  return currentBalance < tx.balanceAtSend - BALANCE_EPSILON;
}

export interface UseGetBalance {
  address: string;
  chainId: string;
  interval?: number;
  nameOnError?: string;
  protocol: SupportedProtocols;
  asset?: { contractAddress: string; decimals: number };
}

export default function useGetBalance({
  address,
  chainId,
  protocol,
  asset,
  interval = 30000,
}: UseGetBalance) {
  const dispatch = useAppDispatch();
  const canShowLoading = useRef(true);
  const lastSnackbarKeyRef = useRef<SnackbarKey>(null);
  const isBalanceDisabled = useAppSelector(isBalanceDisabledSelector);

  const refetchFailedBalances = () => {
    const failedQueries = Object.entries(
      getStore().getState().balanceApi.queries as QueryState<any>
    )
      .filter(
        ([, query]) =>
          query.status === "rejected" &&
          query.startedTimeStamp >= Date.now() - ERROR_WINDOW_MS
      )
      .map(([queryKey, query]) => ({
        queryKey,
        originalArgs: query.originalArgs,
      }));

    failedQueries.forEach(({ originalArgs }) => {
      if (originalArgs) {
        dispatch(
          balanceApi.endpoints.getBalance.initiate(
            originalArgs as GetAccountBalanceArg,
            {
              subscribe: false,
              forceRefetch: true,
            }
          )
        );
      }
    });
  };

  const {
    isLoading,
    balance,
    error,
    isError,
    isFetching,
    isUninitialized,
    refetch,
  } = useGetBalanceQuery(
    {
      address,
      chainId,
      protocol,
      asset: asset || undefined,
    },
    {
      pollingInterval: interval,
      skip: isBalanceDisabled,
      selectFromResult: (args) => ({
        ...args,
        balance: args.currentData || 0,
      }),
    }
  );

  useEffect(() => {
    if (!isFetching) {
      canShowLoading.current = false;
    }
  }, [isFetching]);

  // after the background store was re-created (service worker restarted) its
  // query results are gone: fetch again right away instead of waiting for the
  // next poll
  useEffect(() => {
    if (isBalanceDisabled) return;

    const onReconnected = () => {
      refetch();
    };

    window.addEventListener(STORE_RECONNECTED_EVENT, onReconnected);
    return () =>
      window.removeEventListener(STORE_RECONNECTED_EVENT, onReconnected);
  }, [refetch, isBalanceDisabled]);

  // transactions we sent from this account that the polled balance does not
  // reflect yet: subtract them from the spendable balance and forget them as
  // soon as the balance drops (or they get too old)
  const pendingOutgoing = useAppSelector(pendingOutgoingSelector, shallowEqual);
  const hasBalanceData = !isUninitialized && !isError && !isLoading;
  const pendingForThisBalance = useMemo(
    () =>
      pendingOutgoing.filter((tx) =>
        appliesToBalance(tx, { address, chainId, protocol, asset })
      ),
    [pendingOutgoing, address, chainId, protocol, asset]
  );

  useEffect(() => {
    if (!pendingForThisBalance.length || !hasBalanceData) return;

    const now = Date.now();
    const done = pendingForThisBalance
      .filter((tx) => isPendingOutgoingDone(tx, balance, now))
      .map((tx) => tx.id);

    if (done.length) {
      dispatch(removePendingOutgoing(done));
    }
  }, [pendingForThisBalance, balance, hasBalanceData]);

  const pendingOutgoingAmount = useMemo(() => {
    const now = Date.now();
    return pendingForThisBalance
      .filter((tx) => !isPendingOutgoingDone(tx, balance, now))
      .reduce((sum, tx) => sum + pendingAmountOf(tx, !!asset), 0);
  }, [pendingForThisBalance, balance, asset]);

  const spendableBalance = Math.max((balance || 0) - pendingOutgoingAmount, 0);

  useEffect(() => {
    canShowLoading.current = true;

    return () => {
      if (lastSnackbarKeyRef.current) {
        closeSnackbar(lastSnackbarKeyRef.current);
        lastSnackbarKeyRef.current = null;
      }
    };
  }, [address, chainId, protocol, asset?.contractAddress, asset?.decimals]);

  useDidMountEffect(() => {
    if (lastSnackbarKeyRef.current) return;

    if (!!error) {
      setTimeout(() => {
        if (lastSnackbarKeyRef.current) return;

        lastSnackbarKeyRef.current = enqueueErrorSnackbar({
          message: <AccountsWithBalanceError />,
          preventDuplicate: true,
          key: snackbarKey,
          onRetry: refetchFailedBalances,
          variant: "error",
          persist: true,
          onClose: () => {
            lastSnackbarKeyRef.current = null;
          },
        });
      }, 500);
    }
  }, [error]);

  return {
    error: isError,
    balance,
    /** balance minus the outgoing transactions not yet reflected in it */
    spendableBalance,
    pendingOutgoingAmount,
    isBalanceDisabled,
    isLoading: isBalanceDisabled
      ? false
      : isUninitialized ||
        isLoading ||
        (isFetching && canShowLoading.current && !balance),
  };
}
