import { createConfig, http } from "wagmi";
import { injected } from "wagmi/connectors";
import { chainRpcUrls, supportedChains } from "./chains";

export const wagmiConfig = createConfig({
  chains: supportedChains,
  connectors: [injected()],
  transports: {
    1: http(chainRpcUrls[1]),
    11155111: http(chainRpcUrls[11155111]),
    31337: http(chainRpcUrls[31337]),
  },
});
