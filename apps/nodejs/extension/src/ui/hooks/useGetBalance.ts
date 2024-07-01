import type { SupportedProtocols } from "@poktscan/vault";
import { useEffect, useRef } from "react";
import { closeSnackbar, SnackbarKey } from "notistack";
import AppToBackground from "../../controllers/communication/AppToBackground";
import { balanceMapOfNetworkSelector } from "../../redux/selectors/account";
import useDidMountEffect from "../../hooks/useDidMountEffect";
import { enqueueErrorSnackbar } from "../../utils/ui";
import { useAppSelector } from "../../hooks/redux";

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
  const balanceMap = useAppSelector(
    balanceMapOfNetworkSelector(protocol, chainId, asset)
  );

  const getBalance = () =>
    AppToBackground.getAccountBalance({
      address,
      protocol,
      chainId,
      asset,
    });

  useEffect(() => {
    getBalance();

    return () => {
      if (lastSnackbarKeyRef.current) {
        closeSnackbar(lastSnackbarKeyRef.current);
        lastSnackbarKeyRef.current = null;
      }
    };
  }, [address, chainId, protocol, asset]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (interval) {
      intervalId = setInterval(getBalance, interval);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [address, chainId, protocol, asset, interval]);

  const error = balanceMap?.[address]?.error || false;
  const balance = (balanceMap?.[address]?.amount as number) || 0;
  const isLoading = (balanceMap?.[address]?.loading && !balance) || false;

  useDidMountEffect(() => {
    if (error) {
      lastSnackbarKeyRef.current = enqueueErrorSnackbar({
        message: nameOnError
          ? `Fetch Balance Failed for ${nameOnError}`
          : "Fetch Balance Failed",
        preventDuplicate: true,
        key: `fetch_balance_failed_${address}_${protocol}_${chainId}`,
        onRetry: getBalance,
        variant: "error",
        autoHideDuration: 6000,
      });
    } else {
      if (lastSnackbarKeyRef.current) {
        closeSnackbar(lastSnackbarKeyRef.current);
        lastSnackbarKeyRef.current = null;
      }
    }
  }, [error]);

  return {
    error,
    balance,
    isLoading,
  };
}
