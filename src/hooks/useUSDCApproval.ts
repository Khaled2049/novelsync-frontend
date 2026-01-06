import { useContract } from "@thirdweb-dev/react";
import { useState, useCallback } from "react";

const USDC_ADDRESS = import.meta.env.VITE_USDC_TOKEN_ADDRESS || "";
const CONTRACT_ADDRESS = import.meta.env.VITE_TIPPING_CONTRACT_ADDRESS || "";

export const useUSDCApproval = () => {
  // Initialize as a "token" contract to get ERC20 helpers
  const { contract: usdcContract } = useContract(USDC_ADDRESS, "token");

  const [isApproving, setIsApproving] = useState(false);
  const [approvalTxHash, setApprovalTxHash] = useState<string>("");

  // 1. Check Allowance
  // Removed 'address' param. SDK infers owner from connected wallet.
  const checkAllowance = useCallback(
    async (amountNeeded: string) => {
      if (!usdcContract) return { hasAllowance: false, currentAllowance: "0" };

      try {
        // Checks: How much is [Connected User] allowing [CONTRACT_ADDRESS] to spend?
        const allowance = await usdcContract.erc20.allowance(CONTRACT_ADDRESS);

        const hasAllowance =
          Number(allowance.displayValue) >= Number(amountNeeded);

        return {
          hasAllowance,
          currentAllowance: allowance.displayValue,
        };
      } catch (e) {
        console.error("Allowance check failed", e);
        return { hasAllowance: false, currentAllowance: "0" };
      }
    },
    [usdcContract]
  );

  // 2. Request Approval
  const requestApproval = useCallback(
    async (amount: string) => {
      if (!usdcContract) throw new Error("USDC contract not ready");

      setIsApproving(true);
      try {
        // .setAllowance automatically parses the string to the correct decimals
        const tx = await usdcContract.erc20.setAllowance(
          CONTRACT_ADDRESS,
          amount
        );
        setApprovalTxHash(tx.receipt.transactionHash);
        return tx;
      } catch (err: any) {
        throw new Error(err.reason || "Approval failed");
      } finally {
        setIsApproving(false);
      }
    },
    [usdcContract]
  );

  return {
    checkAllowance,
    requestApproval,
    isApproving,
    approvalTxHash,
  };
};
