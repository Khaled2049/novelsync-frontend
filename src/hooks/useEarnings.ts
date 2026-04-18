import { useState, useCallback, useMemo } from "react";
import { formatEther, formatUnits } from "viem";
import { usePublicClient } from "wagmi";
import {
  tippingPlatformConfig,
  ZERO_ADDRESS,
} from "@/blockchain/tippingPlatform";
import { USDC_ADDRESS } from "@/blockchain/tokens";

interface EarningsData {
  eth: string;
  usdc: string;
}

const toBigInt = (value: unknown): bigint => {
  if (typeof value === "bigint") return value;
  return 0n;
};

export const useEarnings = () => {
  const publicClient = usePublicClient();
  const [lifetimeEarnings, setLifetimeEarnings] = useState<EarningsData>({
    eth: "0",
    usdc: "0",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLifetimeEarnings = useCallback(
    async (walletAddress: string) => {
      if (!publicClient || !walletAddress) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const [ethEarnings, usdcEarnings] = await Promise.all([
          publicClient
            .readContract({
              ...tippingPlatformConfig,
              functionName: "lifetimeEarnings",
              args: [walletAddress as `0x${string}`, ZERO_ADDRESS],
            })
            .catch(() => 0n),
          publicClient
            .readContract({
              ...tippingPlatformConfig,
              functionName: "lifetimeEarnings",
              args: [
                walletAddress as `0x${string}`,
                USDC_ADDRESS as `0x${string}`,
              ],
            })
            .catch(() => 0n),
        ]);

        setLifetimeEarnings({
          eth: formatEther(toBigInt(ethEarnings)),
          usdc: formatUnits(toBigInt(usdcEarnings), 6),
        });
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch earnings",
        );
        setLifetimeEarnings({ eth: "0", usdc: "0" });
      } finally {
        setLoading(false);
      }
    },
    [publicClient],
  );

  const fetchStoryEarnings = useCallback(
    async (storyId: string): Promise<EarningsData> => {
      if (!publicClient || !storyId) {
        return { eth: "0", usdc: "0" };
      }

      try {
        const [ethEarnings, usdcEarnings] = await Promise.all([
          publicClient
            .readContract({
              ...tippingPlatformConfig,
              functionName: "storyEarnings",
              args: [storyId, ZERO_ADDRESS],
            })
            .catch(() => 0n),
          publicClient
            .readContract({
              ...tippingPlatformConfig,
              functionName: "storyEarnings",
              args: [storyId, USDC_ADDRESS as `0x${string}`],
            })
            .catch(() => 0n),
        ]);

        return {
          eth: formatEther(toBigInt(ethEarnings)),
          usdc: formatUnits(toBigInt(usdcEarnings), 6),
        };
      } catch {
        return { eth: "0", usdc: "0" };
      }
    },
    [publicClient],
  );

  return useMemo(
    () => ({
      lifetimeEarnings,
      fetchLifetimeEarnings,
      fetchStoryEarnings,
      loading,
      error,
    }),
    [
      lifetimeEarnings,
      fetchLifetimeEarnings,
      fetchStoryEarnings,
      loading,
      error,
    ],
  );
};
