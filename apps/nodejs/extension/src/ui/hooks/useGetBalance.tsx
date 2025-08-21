import type { QueryState } from "@reduxjs/toolkit/dist/query/core/apiState";
import Stack from "@mui/material/Stack";
import { shallowEqual } from "react-redux";
import Typography from "@mui/material/Typography";
import type { SupportedProtocols } from "@soothe/vault";
import React, { useEffect, useRef, useState } from "react";
import { closeSnackbar, SnackbarKey } from "notistack";
import useDidMountEffect from "./useDidMountEffect";
import { enqueueErrorSnackbar } from "../../utils/ui";
import {
  balanceApi,
  GetAccountBalanceArg,
  useGetBalanceQuery,
} from "../../redux/slices/balance";
import { useAppDispatch, useAppSelector } from "./redux";
import { isBalanceDisabledSelector } from "../../redux/selectors/network";
import { themeColors } from "../theme";
import getStore from "../store";

const snackbarKey = "fetch_balance_failed";

// here we want to display the account balances that thrown an error
// in the last minute
function AccountsWithBalanceError() {
  const accountsWithError = useAppSelector((state) => {
    return Object.values(state.balanceApi.queries).filter((item) => {
      return (
        item.status === "rejected" &&
        item.startedTimeStamp >= Date.now() - 1000 * 60
      );
    });
  }, shallowEqual);

  const [num, setNum] = useState(accountsWithError.length);

  useEffect(() => {
    if (accountsWithError.length === 0) {
      closeSnackbar(snackbarKey);
      return;
    }

    setNum(accountsWithError.length);

    const interval = setInterval(() => {
      setNum(accountsWithError.length);
    }, 1000);

    return () => clearInterval(interval);
  }, [accountsWithError]);

  return (
    <Stack marginBottom={"4px!important"}>
      <Typography color={themeColors.white} fontWeight={500}>
        Balance fetch failed
      </Typography>
      <Typography color={themeColors.bgLightGray} fontSize={11}>
        We couldn't fetch balances for{" "}
        <strong>
          {num} account{num > 1 && "s"}
        </strong>
      </Typography>
    </Stack>
  );
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
          query.startedTimeStamp >= Date.now() - 1000 * 60
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

  const { isLoading, balance, error, isError, isFetching, isUninitialized } =
    useGetBalanceQuery(
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
    isLoading: isBalanceDisabled
      ? false
      : isUninitialized ||
        isLoading ||
        (isFetching && canShowLoading.current && !balance),
  };
}
