const configuredChainId = Number(import.meta.env.VITE_CHAIN_ID || "31337")

const getUSDCAddress = () => {
  if (configuredChainId === 31337) {
    return (
      import.meta.env.VITE_USDC_TOKEN_ADDRESS_ANVIL ||
      import.meta.env.VITE_USDC_TOKEN_ADDRESS ||
      ""
    )
  }

  if (configuredChainId === 11155111) {
    return (
      import.meta.env.VITE_USDC_TOKEN_ADDRESS_SEPOLIA ||
      import.meta.env.VITE_USDC_TOKEN_ADDRESS ||
      ""
    )
  }

  if (configuredChainId === 1) {
    return (
      import.meta.env.VITE_USDC_TOKEN_ADDRESS_MAINNET ||
      import.meta.env.VITE_USDC_TOKEN_ADDRESS ||
      ""
    )
  }

  return import.meta.env.VITE_USDC_TOKEN_ADDRESS || ""
}

export const USDC_ADDRESS = getUSDCAddress()
