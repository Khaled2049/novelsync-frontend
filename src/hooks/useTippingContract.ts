import { TransactionStatus } from "@/types/tipping";
import { useCallback, useMemo, useState } from "react";
import {
  BaseError,
  formatEther,
  parseEther,
  parseUnits,
  type Hash,
} from "viem";
import { usePublicClient, useReadContract, useWriteContract } from "wagmi";
import { tippingPlatformConfig } from "@/blockchain/tippingPlatform";

const getReadableError = (error: unknown) => {
  if (error instanceof BaseError) {
    const revertReason = error.shortMessage || error.message;

    if (revertReason.toLowerCase().includes("user rejected")) {
      return "Transaction rejected";
    }

    return revertReason || "Transaction failed";
  }

  if (error instanceof Error) {
    if (error.message.toLowerCase().includes("user rejected")) {
      return "Transaction rejected";
    }
    return error.message;
  }

  return "Transaction failed";
};

export const useTippingContract = () => {
  const publicClient = usePublicClient();
  const { mutateAsync } = useWriteContract();

  const [txStatus, setTxStatus] = useState<TransactionStatus>(
    TransactionStatus.IDLE,
  );
  const [txHash, setTxHash] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const { data: platformFeeBpsData, isLoading: isLoadingFee } = useReadContract(
    {
      ...tippingPlatformConfig,
      functionName: "platformFeeBps",
    },
  );

  const { data: minTipData, isLoading: isLoadingMin } = useReadContract({
    ...tippingPlatformConfig,
    functionName: "minimumTipAmount",
  });

  const waitForReceipt = useCallback(
    async (hash: Hash) => {
      if (!publicClient) {
        throw new Error("Public client not ready");
      }

      setTxStatus(TransactionStatus.CONFIRMING);
      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      setTxStatus(TransactionStatus.SUCCESS);
      return receipt;
    },
    [publicClient],
  );

  const handleTx = useCallback(
    async (action: () => Promise<Hash>) => {
      setTxStatus(TransactionStatus.PENDING);
      setError(null);

      try {
        const hash = await action();
        setTxHash(hash);
        const receipt = await waitForReceipt(hash);
        return { txHash: hash, receipt };
      } catch (err) {
        const message = getReadableError(err);
        setTxStatus(TransactionStatus.ERROR);
        setError(message);
        throw new Error(message);
      }
    },
    [waitForReceipt],
  );

  const tipAuthorWithETH = useCallback(
    async (author: string, storyId: string, amount: string) => {
      return handleTx(() =>
        mutateAsync({
          ...tippingPlatformConfig,
          functionName: "tipAuthor",
          args: [author as `0x${string}`, storyId],
          value: parseEther(amount),
        }),
      );
    },
    [handleTx, mutateAsync],
  );

  const tipAuthorWithUSDC = useCallback(
    async (author: string, storyId: string, token: string, amount: string) => {
      return handleTx(() =>
        mutateAsync({
          ...tippingPlatformConfig,
          functionName: "tipAuthorWithToken",
          args: [
            author as `0x${string}`,
            storyId,
            token as `0x${string}`,
            parseUnits(amount, 6),
          ],
        }),
      );
    },
    [handleTx, mutateAsync],
  );

  const calculateSplit = useCallback(
    async (amount: string) => {
      if (!publicClient) return null;

      const result = await publicClient.readContract({
        ...tippingPlatformConfig,
        functionName: "calculateSplit",
        args: [parseEther(amount)],
      });
      const [authorAmount, platformFee] = Array.isArray(result)
        ? (result as [bigint, bigint])
        : [0n, 0n];

      return {
        authorAmount: formatEther(authorAmount),
        platformFee: formatEther(platformFee),
        totalAmount: amount,
      };
    },
    [publicClient],
  );

  const resetTxStatus = useCallback(() => {
    setTxStatus(TransactionStatus.IDLE);
    setTxHash("");
    setError(null);
  }, []);

  return useMemo(
    () => ({
      tipAuthorWithETH,
      tipAuthorWithUSDC,
      calculateSplit,
      platformFeeBps: platformFeeBpsData?.toString() || "0",
      minimumTipAmount: minTipData ? formatEther(minTipData as bigint) : "0",
      isLoadingFee,
      isLoadingMin,
      txStatus,
      txHash,
      error,
      resetTxStatus,
    }),
    [
      tipAuthorWithETH,
      tipAuthorWithUSDC,
      calculateSplit,
      platformFeeBpsData,
      minTipData,
      isLoadingFee,
      isLoadingMin,
      txStatus,
      txHash,
      error,
      resetTxStatus,
    ],
  );
};
