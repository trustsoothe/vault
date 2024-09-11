import { useRef } from "react";
import { closeSnackbar, SnackbarKey } from "notistack";
import useDidMountEffect from "../hooks/useDidMountEffect";
import { useGetAppQuery } from "../../redux/slices/pokt";
import { enqueueErrorSnackbar } from "../../utils/ui";

export default function useGetApp(address: string, chainId: string) {
  const lastSnackbarKeyRef = useRef<SnackbarKey>(null);

  const {
    currentData: app,
    isLoading,
    isError,
    error,
    refetch,
    isSuccess,
  } = useGetAppQuery(
    {
      address,
      chainId,
    },
    {
      skip: !address || !chainId,
    }
  );

  useDidMountEffect(() => {
    if (lastSnackbarKeyRef.current) {
      closeSnackbar(lastSnackbarKeyRef.current);
      lastSnackbarKeyRef.current = null;
    }

    if (!!error) {
      setTimeout(() => {
        lastSnackbarKeyRef.current = enqueueErrorSnackbar({
          message: {
            title: "Failed to fetch app",
            content: `There was an error trying to fetch the app ${address}.`,
          },
          preventDuplicate: true,
          key: `fetch_app_failed_${address}_${chainId}`,
          onRetry: refetch,
          variant: "error",
          autoHideDuration: 6000,
        });
      }, 500);
    }
  }, [error]);

  return { app, isLoading, isError, isSuccess };
}
