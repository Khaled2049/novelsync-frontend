import { useState, useEffect, useCallback } from "react";
import { useWallet, useChain } from "@thirdweb-dev/react";

export enum WalletState {
  DISCONNECTED = "DISCONNECTED",
  CONNECTING = "CONNECTING",
  CONNECTED = "CONNECTED",
  READY = "READY",
  WRONG_NETWORK = "WRONG_NETWORK",
  ERROR = "ERROR",
}

const SEPOLIA_CHAIN_ID = 11155111;

interface UseWalletStateReturn {
  state: WalletState;
  address: string | null;
  error: Error | null;
  disconnectWallet: () => Promise<void>;
  isDisconnecting: boolean;
}

export const useWalletState = (): UseWalletStateReturn => {
  const wallet = useWallet();
  const chain = useChain();
  const [state, setState] = useState<WalletState>(WalletState.DISCONNECTED);
  const [address, setAddress] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  // Fetch address when wallet connects
  useEffect(() => {
    const fetchAddress = async () => {
      if (!wallet) {
        setAddress(null);
        setState(WalletState.DISCONNECTED);
        setError(null);
        return;
      }

      // Only fetch if we don't have an address yet
      if (!address) {
        setState(WalletState.CONNECTING);
        try {
          const addr = await wallet.getAddress();
          setAddress(addr);
          setError(null);
        } catch (err) {
          const error =
            err instanceof Error
              ? err
              : new Error("Failed to get wallet address");
          setError(error);
          setState(WalletState.ERROR);
          setAddress(null);
        }
      }
    };

    fetchAddress();
  }, [wallet]);

  // Update state based on address and chain
  useEffect(() => {
    if (!wallet) {
      setState(WalletState.DISCONNECTED);
      return;
    }

    if (!address) {
      // Address is being fetched (handled by previous effect)
      return;
    }

    if (!chain) {
      // Chain info not loaded yet
      setState(WalletState.CONNECTED);
      return;
    }

    if (chain.chainId === SEPOLIA_CHAIN_ID) {
      setState(WalletState.READY);
      setError(null);
    } else {
      setState(WalletState.WRONG_NETWORK);
      setError(null);
    }
  }, [wallet, chain, address]);

  const disconnectWallet = useCallback(async () => {
    if (!wallet) {
      return;
    }

    setIsDisconnecting(true);
    try {
      await wallet.disconnect();
      setAddress(null);
      setError(null);
      setState(WalletState.DISCONNECTED);
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("Failed to disconnect wallet");
      setError(error);
      setState(WalletState.ERROR);
      throw error;
    } finally {
      setIsDisconnecting(false);
    }
  }, [wallet]);

  return {
    state,
    address,
    error,
    disconnectWallet,
    isDisconnecting,
  };
};
