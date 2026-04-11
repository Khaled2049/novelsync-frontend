import { useCallback, useEffect, useMemo, useState } from "react";
import {
  useAccount,
  useChainId,
  useConnect,
  useDisconnect,
  useSwitchChain,
} from "wagmi";

export enum WalletState {
  DISCONNECTED = "DISCONNECTED",
  CONNECTING = "CONNECTING",
  CONNECTED = "CONNECTED",
  READY = "READY",
  WRONG_NETWORK = "WRONG_NETWORK",
  ERROR = "ERROR",
}

const TARGET_CHAIN_ID = Number(import.meta.env.VITE_CHAIN_ID || "31337");

interface UseWalletStateReturn {
  state: WalletState;
  address: string | null;
  error: Error | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => Promise<void>;
  switchToTargetChain: () => Promise<void>;
  isConnecting: boolean;
  isDisconnecting: boolean;
}

export const useWalletState = (): UseWalletStateReturn => {
  const { address, isConnected, isConnecting, isReconnecting } = useAccount();
  const chainId = useChainId();
  const { connectAsync, connectors } = useConnect();
  const { disconnectAsync, isPending: isDisconnecting } = useDisconnect();
  const { switchChainAsync } = useSwitchChain();
  const [manualError, setManualError] = useState<Error | null>(null);

  const state = useMemo(() => {
    if (manualError) return WalletState.ERROR;
    if (!isConnected || !address) {
      if (isConnecting || isReconnecting) return WalletState.CONNECTING;
      return WalletState.DISCONNECTED;
    }

    if (!chainId) return WalletState.CONNECTED;
    if (chainId === TARGET_CHAIN_ID) return WalletState.READY;
    return WalletState.WRONG_NETWORK;
  }, [
    address,
    chainId,
    isConnected,
    isConnecting,
    isReconnecting,
    manualError,
  ]);

  useEffect(() => {
    if (isConnected && address && manualError) {
      setManualError(null);
    }
  }, [isConnected, address, manualError]);

  const connectWallet = useCallback(async () => {
    setManualError(null);

    const connector = connectors[0];
    if (!connector) {
      throw new Error("No wallet connector available");
    }

    try {
      await connectAsync({ connector });
    } catch (err) {
      const parsed =
        err instanceof Error ? err : new Error("Failed to connect wallet");
      setManualError(parsed);
      throw parsed;
    }
  }, [connectAsync, connectors]);

  const disconnectWallet = useCallback(async () => {
    setManualError(null);

    if (!isConnected) {
      return;
    }

    try {
      await disconnectAsync();
    } catch (err) {
      const parsed =
        err instanceof Error ? err : new Error("Failed to disconnect wallet");
      setManualError(parsed);
      throw parsed;
    }
  }, [disconnectAsync, isConnected]);

  const switchToTargetChain = useCallback(async () => {
    if (!switchChainAsync) {
      throw new Error("Network switching is not supported by this wallet");
    }

    try {
      await switchChainAsync({ chainId: TARGET_CHAIN_ID });
    } catch (err) {
      const parsed =
        err instanceof Error ? err : new Error("Failed to switch network");
      setManualError(parsed);
      throw parsed;
    }
  }, [switchChainAsync]);

  return {
    state,
    address: address || null,
    error: manualError,
    connectWallet,
    disconnectWallet,
    switchToTargetChain,
    isConnecting: isConnecting || isReconnecting,
    isDisconnecting,
  };
};
