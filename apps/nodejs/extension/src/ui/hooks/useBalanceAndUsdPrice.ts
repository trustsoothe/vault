import useGetBalance, { UseGetBalance } from "./useGetBalance";
import useUsdPrice from "./useUsdPrice";

export default function useBalanceAndUsdPrice(props: UseGetBalance) {
  const {
    balance,
    spendableBalance,
    pendingOutgoingAmount,
    error: balanceError,
    isLoading: isLoadingBalance,
    isBalanceDisabled,
  } = useGetBalance(props);

  const {
    usdPrice,
    error: usdPriceError,
    isLoading: isLoadingUsdPrice,
    coinSymbol,
  } = useUsdPrice(props);

  return {
    balance,
    spendableBalance,
    pendingOutgoingAmount,
    balanceError,
    isBalanceDisabled,
    isLoadingBalance,
    usdPrice,
    usdPriceError: balanceError || usdPriceError,
    isLoadingUsdPrice: isLoadingUsdPrice || isLoadingBalance,
    usdBalance: (balance || 0) * (usdPrice || 0),
    coinSymbol,
  };
}
