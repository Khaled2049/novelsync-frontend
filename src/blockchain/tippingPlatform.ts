import { getAddress } from "viem"
import { tippingPlatformAbi } from "./abi/tippingPlatformAbi"

const fallbackAddress = "0x0000000000000000000000000000000000000000"
const configuredChainId = Number(import.meta.env.VITE_CHAIN_ID || "31337")

const getContractAddress = () => {
  if (configuredChainId === 31337) {
    return (
      import.meta.env.VITE_TIPPING_CONTRACT_ADDRESS_ANVIL ||
      import.meta.env.VITE_TIPPING_CONTRACT_ADDRESS ||
      fallbackAddress
    )
  }

  if (configuredChainId === 11155111) {
    return (
      import.meta.env.VITE_TIPPING_CONTRACT_ADDRESS_SEPOLIA ||
      import.meta.env.VITE_TIPPING_CONTRACT_ADDRESS ||
      fallbackAddress
    )
  }

  if (configuredChainId === 1) {
    return (
      import.meta.env.VITE_TIPPING_CONTRACT_ADDRESS_MAINNET ||
      import.meta.env.VITE_TIPPING_CONTRACT_ADDRESS ||
      fallbackAddress
    )
  }

  return import.meta.env.VITE_TIPPING_CONTRACT_ADDRESS || fallbackAddress
}

const configuredAddress = getContractAddress()

export const TIPPING_PLATFORM_ADDRESS = getAddress(configuredAddress)

export const tippingPlatformConfig = {
  address: TIPPING_PLATFORM_ADDRESS,
  abi: tippingPlatformAbi,
} as const

export const ZERO_ADDRESS = fallbackAddress
