import { defineChain } from "viem";

const sharedRpcUrl = import.meta.env.VITE_RPC_URL;
const anvilRpcUrl =
  import.meta.env.VITE_ANVIL_RPC_URL || sharedRpcUrl || "http://127.0.0.1:8545";
const sepoliaRpcUrl =
  import.meta.env.VITE_SEPOLIA_RPC_URL ||
  sharedRpcUrl ||
  "https://rpc.sepolia.org";
const mainnetRpcUrl =
  import.meta.env.VITE_MAINNET_RPC_URL ||
  sharedRpcUrl ||
  "https://ethereum-rpc.publicnode.com";

export const chainRpcUrls = {
  1: mainnetRpcUrl,
  11155111: sepoliaRpcUrl,
  31337: anvilRpcUrl,
} as const;

export const anvil = defineChain({
  id: 31337,
  name: "Anvil",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: [chainRpcUrls[31337]] },
    public: { http: [chainRpcUrls[31337]] },
  },
});

export const sepolia = defineChain({
  id: 11155111,
  name: "Sepolia",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: [chainRpcUrls[11155111]] },
    public: { http: [chainRpcUrls[11155111]] },
  },
  blockExplorers: {
    default: { name: "Etherscan", url: "https://sepolia.etherscan.io" },
  },
});

export const mainnet = defineChain({
  id: 1,
  name: "Ethereum",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: [chainRpcUrls[1]] },
    public: { http: [chainRpcUrls[1]] },
  },
  blockExplorers: {
    default: { name: "Etherscan", url: "https://etherscan.io" },
  },
});

const configuredChainId = Number(import.meta.env.VITE_CHAIN_ID || "31337");

export const supportedChains = [anvil, sepolia, mainnet] as const;

export const activeChain =
  supportedChains.find((chain) => chain.id === configuredChainId) || anvil;
