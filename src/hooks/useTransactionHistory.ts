import {
  useContract,
  useContractEvents,
  useAddress,
} from "@thirdweb-dev/react";
import { utils, constants } from "ethers";
import { useMemo } from "react";
import { TransactionStatus, TipTransaction } from "@/types/tipping";
const CONTRACT_ADDRESS = import.meta.env.VITE_TIPPING_CONTRACT_ADDRESS || "";

export const useTransactionHistory = (authorAddress?: string) => {
  const { contract } = useContract(CONTRACT_ADDRESS);
  const userAddress = useAddress();

  const { data: events, isLoading } = useContractEvents(contract, "TipSent", {
    queryFilter: { fromBlock: -10000 },
  });

  const history = useMemo(() => {
    if (!events || !userAddress)
      return { userTips: [], authorTips: [], allTips: [], isLoading };

    const formattedTips: TipTransaction[] = events.map((e: any) => {
      const { from, to, totalAmount, token, timestamp } = e.data;
      const isETH = token === constants.AddressZero;

      return {
        txHash: e.transaction.transactionHash,
        from,
        to,
        // Auto-format based on token type (18 decimals for ETH, 6 for USDC)
        amount: isETH
          ? utils.formatEther(totalAmount)
          : utils.formatUnits(totalAmount, 6),
        token,
        timestamp: Number(timestamp) * 1000,
        status: TransactionStatus.SUCCESS,
      };
    });

    return {
      allTips: formattedTips,
      userTips: formattedTips.filter(
        (t: TipTransaction) =>
          t.from.toLowerCase() === userAddress.toLowerCase()
      ),
      authorTips: authorAddress
        ? formattedTips.filter(
            (t: TipTransaction) =>
              t.to.toLowerCase() === authorAddress.toLowerCase()
          )
        : [],
      isLoading,
    };
  }, [events, userAddress, authorAddress, isLoading]);

  return history;
};
