import { useContract } from "@thirdweb-dev/react";
import { useState, useCallback, useMemo } from "react";
import { utils, BigNumber } from "ethers";

const CONTRACT_ADDRESS = import.meta.env.VITE_TIPPING_CONTRACT_ADDRESS || "";
const USDC_ADDRESS = import.meta.env.VITE_USDC_TOKEN_ADDRESS || "";

interface EarningsData {
  eth: string;
  usdc: string;
}

export const useEarnings = () => {
  const { contract } = useContract(CONTRACT_ADDRESS);
  const [lifetimeEarnings, setLifetimeEarnings] = useState<EarningsData>({
    eth: "0",
    usdc: "0",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLifetimeEarnings = useCallback(
    async (walletAddress: string) => {
      if (!contract || !walletAddress) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Simple direct calls - thirdweb handles everything
        const [ethEarnings, usdcEarnings] = await Promise.all([
          (contract as any)
            .call("lifetimeEarnings", [
              walletAddress,
              "0x0000000000000000000000000000000000000000",
            ])
            .catch(() => BigNumber.from(0)),
          (contract as any)
            .call("lifetimeEarnings", [walletAddress, USDC_ADDRESS])
            .catch(() => BigNumber.from(0)),
        ]);

        setLifetimeEarnings({
          eth: utils.formatEther(ethEarnings),
          usdc: utils.formatUnits(usdcEarnings, 6),
        });
      } catch (err) {
        console.error("Error fetching lifetime earnings:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch earnings"
        );
        setLifetimeEarnings({ eth: "0", usdc: "0" });
      } finally {
        setLoading(false);
      }
    },
    [contract, USDC_ADDRESS]
  );

  const fetchStoryEarnings = useCallback(
    async (storyId: string): Promise<EarningsData> => {
      if (!contract || !storyId) {
        return { eth: "0", usdc: "0" };
      }

      try {
        const [ethEarnings, usdcEarnings] = await Promise.all([
          (contract as any)
            .call("storyEarnings", [
              storyId,
              "0x0000000000000000000000000000000000000000",
            ])
            .catch(() => BigNumber.from(0)),
          (contract as any)
            .call("storyEarnings", [storyId, USDC_ADDRESS])
            .catch(() => BigNumber.from(0)),
        ]);

        return {
          eth: utils.formatEther(ethEarnings),
          usdc: utils.formatUnits(usdcEarnings, 6),
        };
      } catch (err) {
        console.error(`Error fetching earnings for story ${storyId}:`, err);
        return { eth: "0", usdc: "0" };
      }
    },
    [contract, USDC_ADDRESS]
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
    ]
  );
};
