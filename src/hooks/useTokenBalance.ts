import { useCallback, useMemo } from "react"
import { erc20Abi, formatUnits } from "viem"
import { useAccount, useBalance, useReadContract } from "wagmi"

const USDC_ADDRESS = import.meta.env.VITE_USDC_TOKEN_ADDRESS || ""
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as const

export const useTokenBalance = () => {
  const { address } = useAccount()

  const {
    data: ethData,
    isLoading: isLoadingETH,
    refetch: refetchETH,
  } = useBalance({
    address,
  })

  const {
    data: usdcRaw,
    isLoading: isLoadingUSDC,
    refetch: refetchUSDC,
  } = useReadContract({
    address: USDC_ADDRESS as `0x${string}`,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [address || ZERO_ADDRESS],
    query: {
      enabled: Boolean(address && USDC_ADDRESS),
    },
  })

  const refetch = useCallback(async () => {
    await Promise.all([refetchETH(), refetchUSDC()])
  }, [refetchETH, refetchUSDC])

  return useMemo(
    () => ({
      ethBalance: ethData
        ? formatUnits(ethData.value, ethData.decimals || 18)
        : "0",
      usdcBalance: usdcRaw ? formatUnits(usdcRaw, 6) : "0",
      isLoading: isLoadingETH || isLoadingUSDC,
      refetch,
    }),
    [ethData, usdcRaw, isLoadingETH, isLoadingUSDC, refetch]
  )
}
