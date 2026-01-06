import { ThirdwebProvider } from "@thirdweb-dev/react";
import { Sepolia } from "@thirdweb-dev/chains";
import { ReactNode } from "react";

interface Web3ProviderProps {
  children: ReactNode;
}

export const Web3Provider = ({ children }: Web3ProviderProps) => {
  const clientId = import.meta.env.VITE_THIRDWEB_CLIENT_ID || "";

  if (!clientId) {
    console.warn("VITE_THIRDWEB_CLIENT_ID is not set");
  }

  return (
    <ThirdwebProvider
      activeChain={Sepolia}
      clientId={clientId}
      supportedChains={[Sepolia]}
    >
      {children}
    </ThirdwebProvider>
  );
};
