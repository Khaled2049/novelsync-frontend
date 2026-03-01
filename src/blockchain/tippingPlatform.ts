import { getAddress } from "viem"
import { tippingPlatformAbi } from "./abi/tippingPlatformAbi"

const fallbackAddress = "0x0000000000000000000000000000000000000000"
const configuredAddress =
  import.meta.env.VITE_TIPPING_CONTRACT_ADDRESS || fallbackAddress

export const TIPPING_PLATFORM_ADDRESS = getAddress(configuredAddress)

export const tippingPlatformConfig = {
  address: TIPPING_PLATFORM_ADDRESS,
  abi: tippingPlatformAbi,
} as const

export const ZERO_ADDRESS = fallbackAddress
