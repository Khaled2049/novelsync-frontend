import { useBalance } from "@thirdweb-dev/react";
import { useCallback } from "react";

const USDC_ADDRESS = import.meta.env.VITE_USDC_TOKEN_ADDRESS || "";

export const useTokenBalance = () => {
  // 1. Get Native ETH Balance
  const {
    data: ethData,
    isLoading: isLoadingETH,
    refetch: refetchETH,
  } = useBalance();

  // 2. Get USDC Balance (Pass the token address)
  const {
    data: usdcData,
    isLoading: isLoadingUSDC,
    refetch: refetchUSDC,
  } = useBalance(USDC_ADDRESS);

  const refetch = useCallback(async () => {
    await Promise.all([refetchETH(), refetchUSDC()]);
  }, [refetchETH, refetchUSDC]);

  return {
    ethBalance: ethData?.displayValue || "0",
    usdcBalance: usdcData?.displayValue || "0",
    isLoading: isLoadingETH || isLoadingUSDC,
    refetch,
  };
};
