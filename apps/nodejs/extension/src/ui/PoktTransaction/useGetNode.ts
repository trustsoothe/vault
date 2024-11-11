import { useRef } from "react";
import { closeSnackbar, SnackbarKey } from "notistack";
import useDidMountEffect from "../hooks/useDidMountEffect";
import { useGetNodeQuery } from "../../redux/slices/pokt";
import { enqueueErrorSnackbar } from "../../utils/ui";

export default function useGetNode(address: string, chainId: string) {
  const lastSnackbarKeyRef = useRef<SnackbarKey>(null);

  const {
    currentData: node,
    isLoading,
    isError,
    error,
    refetch,
    isSuccess,
  } = useGetNodeQuery(
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
            title: "Failed to fetch node",
            content: `There was an error trying to fetch the node ${address}.`,
          },
          preventDuplicate: true,
          key: `fetch_node_failed_${address}_${chainId}`,
          onRetry: refetch,
          variant: "error",
          autoHideDuration: 6000,
        });
      }, 500);
    }
  }, [error]);

  return { node, isLoading, isError, isSuccess };
}
