import { useEffect, useMemo, useState } from "react";
import { formatEther, formatUnits, parseAbiItem } from "viem";
import { useAccount, usePublicClient } from "wagmi";
import { TransactionStatus, TipTransaction } from "@/types/tipping";
import {
  TIPPING_PLATFORM_ADDRESS,
  ZERO_ADDRESS,
} from "@/blockchain/tippingPlatform";

const tipSentEvent = parseAbiItem(
  "event TipSent(address indexed from, address indexed to, string storyId, uint256 totalAmount, uint256 authorAmount, uint256 platformFee, address token, uint256 timestamp)",
);

export const useTransactionHistory = (authorAddress?: string) => {
  const publicClient = usePublicClient();
  const { address: userAddress } = useAccount();
  const [events, setEvents] = useState<TipTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadEvents = async () => {
      if (!publicClient) {
        setEvents([]);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);

        const latest = await publicClient.getBlockNumber();
        const fromBlock = latest > 10000n ? latest - 10000n : 0n;

        const logs = await publicClient.getLogs({
          address: TIPPING_PLATFORM_ADDRESS,
          event: tipSentEvent,
          fromBlock,
          toBlock: "latest",
        });

        const formattedTips: TipTransaction[] = logs.map((log) => {
          const token = log.args.token || ZERO_ADDRESS;
          const isETH = token.toLowerCase() === ZERO_ADDRESS.toLowerCase();

          return {
            txHash: log.transactionHash || "",
            from: log.args.from || ZERO_ADDRESS,
            to: log.args.to || ZERO_ADDRESS,
            amount: isETH
              ? formatEther(log.args.totalAmount || 0n)
              : formatUnits(log.args.totalAmount || 0n, 6),
            token,
            timestamp: Number(log.args.timestamp || 0n) * 1000,
            status: TransactionStatus.SUCCESS,
          };
        });

        setEvents(formattedTips);
      } catch {
        setEvents([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadEvents();
  }, [publicClient]);

  return useMemo(() => {
    if (!userAddress) {
      return { userTips: [], authorTips: [], allTips: events, isLoading };
    }

    return {
      allTips: events,
      userTips: events.filter(
        (tip) => tip.from.toLowerCase() === userAddress.toLowerCase(),
      ),
      authorTips: authorAddress
        ? events.filter(
            (tip) => tip.to.toLowerCase() === authorAddress.toLowerCase(),
          )
        : [],
      isLoading,
    };
  }, [events, userAddress, authorAddress, isLoading]);
};
