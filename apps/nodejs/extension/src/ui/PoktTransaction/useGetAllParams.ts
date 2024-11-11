import { useRef } from "react";
import { closeSnackbar, SnackbarKey } from "notistack";
import { useGetAllParamsQuery } from "../../redux/slices/pokt";
import useDidMountEffect from "../hooks/useDidMountEffect";
import { enqueueErrorSnackbar } from "../../utils/ui";

export default function useGetAllParams(chainId: string) {
  const lastSnackbarKeyRef = useRef<SnackbarKey>(null);
  const {
    isError,
    currentData: allParams,
    error,
    refetch,
    isLoading,
  } = useGetAllParamsQuery(chainId);

  useDidMountEffect(() => {
    if (lastSnackbarKeyRef.current) {
      closeSnackbar(lastSnackbarKeyRef.current);
      lastSnackbarKeyRef.current = null;
    }

    if (!!error) {
      setTimeout(() => {
        lastSnackbarKeyRef.current = enqueueErrorSnackbar({
          message: {
            title: "Failed to all params",
            content: `There was an error trying to fetch all params.`,
          },
          preventDuplicate: true,
          key: `fetch_all_params_failed_${chainId}`,
          onRetry: refetch,
          variant: "error",
          autoHideDuration: 6000,
        });
      }, 500);
    }
  }, [error]);

  return { allParams, isLoading, isError };
}
