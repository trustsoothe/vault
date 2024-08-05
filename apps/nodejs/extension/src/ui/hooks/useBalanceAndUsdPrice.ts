import useGetBalance, { UseGetBalance } from "./useGetBalance";
import useUsdPrice from "./useUsdPrice";

export default function useBalanceAndUsdPrice(props: UseGetBalance) {
  const {
    balance,
    error: balanceError,
    isLoading: isLoadingBalance,
  } = useGetBalance(props);

  const {
    usdPrice,
    error: usdPriceError,
    isLoading: isLoadingUsdPrice,
    coinSymbol,
  } = useUsdPrice(props);

  return {
    balance,
    balanceError,
    isLoadingBalance,
    usdPrice,
    usdPriceError: balanceError || usdPriceError,
    isLoadingUsdPrice: isLoadingUsdPrice || isLoadingBalance,
    usdBalance: (balance || 0) * (usdPrice || 0),
    coinSymbol,
  };
}
