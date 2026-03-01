import { createConfig, http } from "wagmi"
import { injected } from "wagmi/connectors"
import { supportedChains } from "./chains"

const rpcUrl = import.meta.env.VITE_RPC_URL || "http://127.0.0.1:8545"

export const wagmiConfig = createConfig({
  chains: supportedChains,
  connectors: [injected()],
  transports: {
    1: http(rpcUrl),
    11155111: http(rpcUrl),
    31337: http(rpcUrl),
  },
})
