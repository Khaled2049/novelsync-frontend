import {
  useContract,
  useContractWrite,
  useContractRead,
} from "@thirdweb-dev/react";
import { TransactionStatus } from "@/types/tipping";
import { useState, useCallback } from "react";
import { utils } from "ethers";

const CONTRACT_ADDRESS = import.meta.env.VITE_TIPPING_CONTRACT_ADDRESS || "";

export const useTippingContract = () => {
  const { contract } = useContract(CONTRACT_ADDRESS);
  const [txStatus, setTxStatus] = useState<TransactionStatus>(
    TransactionStatus.IDLE
  );
  const [txHash, setTxHash] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  // Writes
  const { mutateAsync: tipETH } = useContractWrite(
    contract as any,
    "tipAuthor"
  );
  const { mutateAsync: tipToken } = useContractWrite(
    contract as any,
    "tipAuthorWithToken"
  );

  // Reads
  const { data: platformFeeBps, isLoading: isLoadingFee } = useContractRead(
    contract as any,
    "platformFeeBps"
  );
  const { data: minTipData, isLoading: isLoadingMin } = useContractRead(
    contract as any,
    "minimumTipAmount"
  );

  // Unified Transaction Handler
  const handleTx = async (action: () => Promise<any>) => {
    setTxStatus(TransactionStatus.PENDING);
    setError(null);
    try {
      const data = await action();
      const hash = data.receipt.transactionHash;
      setTxHash(hash);
      setTxStatus(TransactionStatus.SUCCESS);
      return { txHash: hash, receipt: data.receipt };
    } catch (err: any) {
      console.error(err);
      setTxStatus(TransactionStatus.ERROR);
      // Simple error parsing
      const msg = err.reason || err.message || "Transaction failed";
      const finalMsg = msg.includes("user rejected")
        ? "Transaction rejected"
        : msg;
      setError(finalMsg);
      throw new Error(finalMsg);
    }
  };

  const tipAuthorWithETH = useCallback(
    (author: string, storyId: string, amount: string) => {
      return handleTx(() =>
        tipETH({
          args: [author, storyId] as any,
          overrides: { value: utils.parseEther(amount) } as any,
        } as any)
      );
    },
    [tipETH]
  );

  const tipAuthorWithUSDC = useCallback(
    (author: string, storyId: string, token: string, amount: string) => {
      // USDC needs 6 decimals, explicitly parsing ensures accuracy
      return handleTx(() =>
        tipToken({
          args: [author, storyId, token, utils.parseUnits(amount, 6)] as any,
        } as any)
      );
    },
    [tipToken]
  );

  const calculateSplit = useCallback(
    async (amount: string) => {
      if (!contract) return null;
      const result = await (contract as any).call("calculateSplit", [
        utils.parseEther(amount),
      ]);
      return {
        authorAmount: utils.formatEther(result[0]),
        platformFee: utils.formatEther(result[1]),
        totalAmount: amount,
      };
    },
    [contract]
  );

  const resetTxStatus = useCallback(() => {
    setTxStatus(TransactionStatus.IDLE);
    setTxHash("");
    setError(null);
  }, []);

  return {
    tipAuthorWithETH,
    tipAuthorWithUSDC,
    calculateSplit,
    platformFeeBps: (platformFeeBps as any)?.toString() || "0",
    minimumTipAmount: minTipData ? utils.formatEther(minTipData) : "0",
    isLoadingFee,
    isLoadingMin,
    txStatus,
    txHash,
    error,
    resetTxStatus,
  };
};
