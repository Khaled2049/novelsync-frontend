import { useState, useCallback } from "react"
import { erc20Abi, parseUnits } from "viem"
import { useAccount, usePublicClient, useWriteContract } from "wagmi"
import { TIPPING_PLATFORM_ADDRESS } from "@/blockchain/tippingPlatform"
import { USDC_ADDRESS } from "@/blockchain/tokens"

export const useUSDCApproval = () => {
  const { address } = useAccount()
  const publicClient = usePublicClient()
  const { mutateAsync } = useWriteContract()

  const [isApproving, setIsApproving] = useState(false)
  const [approvalTxHash, setApprovalTxHash] = useState<string>("")

  const checkAllowance = useCallback(
    async (amountNeeded: string) => {
      if (!address || !publicClient || !USDC_ADDRESS) {
        return { hasAllowance: false, currentAllowance: "0" }
      }

      try {
        const allowance = await publicClient.readContract({
          address: USDC_ADDRESS as `0x${string}`,
          abi: erc20Abi,
          functionName: "allowance",
          args: [address, TIPPING_PLATFORM_ADDRESS],
        })

        const needed = parseUnits(amountNeeded, 6)
        const hasAllowance = allowance >= needed

        return {
          hasAllowance,
          currentAllowance: allowance.toString(),
        }
      } catch {
        return { hasAllowance: false, currentAllowance: "0" }
      }
    },
    [address, publicClient]
  )

  const requestApproval = useCallback(
    async (amount: string) => {
      if (!publicClient || !USDC_ADDRESS) {
        throw new Error("USDC contract not ready")
      }

      setIsApproving(true)
      try {
        const hash = await mutateAsync({
          address: USDC_ADDRESS as `0x${string}`,
          abi: erc20Abi,
          functionName: "approve",
          args: [TIPPING_PLATFORM_ADDRESS, parseUnits(amount, 6)],
        })

        setApprovalTxHash(hash)
        await publicClient.waitForTransactionReceipt({ hash })
        return hash
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Approval transaction failed"
        throw new Error(message)
      } finally {
        setIsApproving(false)
      }
    },
    [publicClient, mutateAsync]
  )

  return {
    checkAllowance,
    requestApproval,
    isApproving,
    approvalTxHash,
  }
}
