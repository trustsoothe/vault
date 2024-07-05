import type { SupportedProtocols } from "@poktscan/vault";
import { useEffect, useRef } from "react";
import { closeSnackbar, SnackbarKey } from "notistack";
import useDidMountEffect from "./useDidMountEffect";
import { enqueueErrorSnackbar } from "../../utils/ui";
import { useGetBalanceQuery } from "../../redux/slices/balance";

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
  nameOnError = "",
}: UseGetBalance) {
  const lastSnackbarKeyRef = useRef<SnackbarKey>(null);
  const { isLoading, balance, error, isError, refetch } = useGetBalanceQuery(
    {
      address,
      chainId,
      protocol,
      asset,
    },
    {
      pollingInterval: interval,
      selectFromResult: (args) => ({
        ...args,
        balance: args.data || 0,
      }),
    }
  );

  useEffect(() => {
    return () => {
      if (lastSnackbarKeyRef.current) {
        closeSnackbar(lastSnackbarKeyRef.current);
        lastSnackbarKeyRef.current = null;
      }
    };
  }, [address, chainId, protocol, asset]);

  useDidMountEffect(() => {
    if (lastSnackbarKeyRef.current) {
      closeSnackbar(lastSnackbarKeyRef.current);
      lastSnackbarKeyRef.current = null;
    }

    if (!!error) {
      setTimeout(() => {
        lastSnackbarKeyRef.current = enqueueErrorSnackbar({
          message: nameOnError
            ? `Fetch Balance Failed for ${nameOnError}`
            : "Fetch Balance Failed",
          preventDuplicate: true,
          key: `fetch_balance_failed_${address}_${protocol}_${chainId}`,
          onRetry: refetch,
          variant: "error",
          autoHideDuration: 6000,
        });
      }, 500);
    }
  }, [error]);

  return {
    error: isError,
    balance,
    isLoading,
  };
}
