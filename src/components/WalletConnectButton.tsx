import React, { useEffect, useRef, useState } from "react"
import {
  CheckCircle2,
  AlertCircle,
  Loader,
  XCircle,
  LogOut,
  Copy,
  ChevronDown,
  Wallet,
  Info,
} from "lucide-react"
import { useTheme } from "@/contexts/ThemeContext"
import { useWalletState, WalletState } from "@/hooks/useWalletState"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { useAuthContext } from "@/contexts/AuthContext"
import { userService } from "@/services/UserService"
import { useChainId } from "wagmi"

const TARGET_CHAIN_ID = Number(import.meta.env.VITE_CHAIN_ID || "31337")

const getNetworkName = (chainId: number | undefined) => {
  if (!chainId) return "Unknown"
  if (chainId === 31337) return "Anvil"
  if (chainId === 11155111) return "Sepolia"
  if (chainId === 1) return "Ethereum"
  return `Chain ${chainId}`
}

export const WalletConnectButton: React.FC = () => {
  const chainId = useChainId()
  const { theme } = useTheme()
  const { user } = useAuthContext()
  const {
    state,
    address,
    error,
    connectWallet,
    disconnectWallet,
    switchToTargetChain,
    isConnecting,
    isDisconnecting,
  } = useWalletState()

  const prevStateRef = useRef<WalletState>(WalletState.DISCONNECTED)
  const isFirstRenderRef = useRef(true)
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [hasCheckedSavedAddress, setHasCheckedSavedAddress] = useState(false)

  useEffect(() => {
    const checkSavedAddress = async () => {
      if (
        state === WalletState.READY &&
        address &&
        user?.uid &&
        !hasCheckedSavedAddress
      ) {
        try {
          const savedAddress = await userService.getUserWalletAddress(user.uid)
          setHasCheckedSavedAddress(true)

          if (
            !savedAddress ||
            savedAddress.toLowerCase() !== address.toLowerCase()
          ) {
            setShowSaveDialog(true)
          }
        } catch {
          setHasCheckedSavedAddress(true)
          setShowSaveDialog(true)
        }
      }
    }

    checkSavedAddress()
  }, [state, address, user?.uid, hasCheckedSavedAddress])

  useEffect(() => {
    if (state === WalletState.DISCONNECTED) {
      setHasCheckedSavedAddress(false)
      setShowSaveDialog(false)
    }
  }, [state])

  useEffect(() => {
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false
      prevStateRef.current = state
      return
    }

    if (prevStateRef.current === state) return

    if (
      state === WalletState.READY &&
      prevStateRef.current === WalletState.DISCONNECTED
    ) {
      toast.success("Wallet connected successfully", {
        description: `Connected to ${getNetworkName(chainId)} network`,
      })
    }

    if (state === WalletState.WRONG_NETWORK) {
      toast.warning("Wrong network detected", {
        description: `Please switch to ${getNetworkName(TARGET_CHAIN_ID)}`,
        duration: 5000,
      })
    }

    if (state === WalletState.ERROR && error) {
      toast.error("Wallet connection error", {
        description: error.message,
        duration: 5000,
      })
    }

    prevStateRef.current = state
  }, [state, error, chainId])

  const handleConnect = async () => {
    try {
      await connectWallet()
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to connect wallet"
      toast.error(errorMessage)
    }
  }

  const handleDisconnect = async () => {
    try {
      await disconnectWallet()
      toast.success("Wallet disconnected successfully")
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to disconnect wallet"
      toast.error(errorMessage)
    }
  }

  const handleSwitchNetwork = async () => {
    try {
      await switchToTargetChain()
      toast.success(`Switched to ${getNetworkName(TARGET_CHAIN_ID)}`)
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to switch network"
      toast.error(errorMessage)
    }
  }

  const handleCopyAddress = async () => {
    if (!address) return

    try {
      await navigator.clipboard.writeText(address)
      toast.success("Address copied to clipboard")
    } catch {
      toast.error("Failed to copy address")
    }
  }

  const handleSaveAddress = async () => {
    if (!user?.uid || !address) {
      toast.error("User ID or wallet address is missing")
      return
    }

    setIsSaving(true)
    try {
      await userService.updateUserWalletAddress(user.uid, address)
      setShowSaveDialog(false)
      setHasCheckedSavedAddress(true)
      toast.success("Wallet address saved to your profile", {
        description: "You can now receive tips from readers",
      })
    } catch (saveError) {
      const errorMessage =
        saveError instanceof Error
          ? saveError.message
          : "Failed to save wallet address"

      toast.error("Failed to save wallet address", {
        description: errorMessage,
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleSkipSave = () => {
    setShowSaveDialog(false)
    setHasCheckedSavedAddress(true)
  }

  if (!user) {
    return null
  }

  const stateConfig = {
    [WalletState.READY]: {
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
      text: null,
      detail: `${getNetworkName(chainId)} Network`,
    },
    [WalletState.WRONG_NETWORK]: {
      icon: <AlertCircle className="w-4 h-4 text-yellow-500" />,
      text: "Wrong Network",
      detail: `Chain ID: ${chainId || "Unknown"}`,
    },
    [WalletState.CONNECTING]: {
      icon: <Loader className="w-4 h-4 animate-spin text-blue-500" />,
      text: "Connecting...",
      detail: "Connecting...",
    },
    [WalletState.CONNECTED]: {
      icon: <Loader className="w-4 h-4 animate-spin text-blue-500" />,
      text: "Connecting...",
      detail: "Connecting...",
    },
    [WalletState.ERROR]: {
      icon: <XCircle className="w-4 h-4 text-red-500" />,
      text: "Error",
      detail: error?.message || "Connection Error",
    },
    [WalletState.DISCONNECTED]: {
      icon: null,
      text: null,
      detail: "Disconnected",
    },
  }

  const currentState =
    stateConfig[state] || stateConfig[WalletState.DISCONNECTED]

  if (address && state !== WalletState.DISCONNECTED) {
    const truncatedAddress = `${address.slice(0, 6)}...${address.slice(-4)}`

    return (
      <>
        <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-full bg-dark-green/10 dark:bg-light-green/10">
                  <Wallet className="w-6 h-6 text-dark-green dark:text-light-green" />
                </div>
                <DialogTitle className="text-xl font-semibold text-black dark:text-white">
                  Save Wallet Address?
                </DialogTitle>
              </div>
              <DialogDescription className="text-base text-black/70 dark:text-white/70 pt-2">
                Save your wallet address to your profile to receive tips from
                readers.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="p-4 rounded-lg border border-dark-green/20 dark:border-light-green/20 bg-dark-green/5 dark:bg-light-green/5">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-dark-green dark:text-light-green mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-black dark:text-white mb-1">
                      Why save your wallet address?
                    </p>
                    <p className="text-xs text-black/70 dark:text-white/70">
                      Readers need your saved wallet address to send you tips.
                      Without it, you won't be able to receive payments for your
                      stories.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-lg border border-black/10 dark:border-white/10 bg-neutral-50 dark:bg-black">
                <p className="text-xs font-medium text-black/60 dark:text-white/60 mb-1">
                  Wallet Address
                </p>
                <p className="text-sm font-mono text-black dark:text-white break-all">
                  {address}
                </p>
              </div>
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={handleSkipSave}
                disabled={isSaving}
                className="w-full sm:w-auto border border-black/20 dark:border-white/20 bg-white dark:bg-neutral-900 hover:bg-black/5 dark:hover:bg-white/5"
              >
                Skip for Now
              </Button>
              <Button
                onClick={handleSaveAddress}
                disabled={isSaving}
                className="w-full sm:w-auto bg-dark-green dark:bg-light-green text-white hover:bg-light-green dark:hover:bg-dark-green transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Save Address
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors focus:outline-none focus:ring-2 focus:ring-dark-green dark:focus:ring-light-green focus:ring-offset-2"
              disabled={isDisconnecting}
            >
              {currentState.icon}
              <div className="flex flex-col items-start">
                <span className="text-xs font-medium text-black dark:text-white">
                  {truncatedAddress}
                </span>
                {currentState.text && (
                  <span className="text-xs text-black/60 dark:text-white/60">
                    {currentState.text}
                  </span>
                )}
              </div>
              <ChevronDown className="w-3 h-3 text-black/60 dark:text-white/60 ml-1" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-56 bg-white dark:bg-neutral-900 border border-black/10 dark:border-white/10"
          >
            <DropdownMenuLabel className="px-3 py-2">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-black dark:text-white">
                  Wallet Address
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-black/70 dark:text-white/70 truncate">
                    {address}
                  </span>
                  <button
                    onClick={handleCopyAddress}
                    className="p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded transition-colors flex-shrink-0"
                    title="Copy address"
                  >
                    <Copy className="w-3 h-3 text-black/60 dark:text-white/60" />
                  </button>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="px-3 py-2">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-black dark:text-white">
                  Network Status
                </span>
                <div className="flex items-center gap-2">
                  {currentState.icon}
                  <span className="text-xs text-black/70 dark:text-white/70">
                    {currentState.detail}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            {state === WalletState.WRONG_NETWORK && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleSwitchNetwork}
                  className="cursor-pointer"
                >
                  Switch to {getNetworkName(TARGET_CHAIN_ID)}
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleDisconnect}
              disabled={isDisconnecting}
              className="text-red-500 focus:text-red-600 focus:bg-red-500/10 dark:focus:bg-red-500/10 cursor-pointer"
            >
              {isDisconnecting ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  Disconnecting...
                </>
              ) : (
                <>
                  <LogOut className="w-4 h-4 mr-2" />
                  Disconnect Wallet
                </>
              )}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </>
    )
  }

  return (
    <button
      onClick={handleConnect}
      disabled={isConnecting}
      className="bg-dark-green dark:bg-light-green text-white hover:bg-light-green dark:hover:bg-dark-green font-semibold py-2 px-4 rounded-small transition-colors duration-300 border-0 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
      data-theme={theme}
    >
      {isConnecting ? "Connecting..." : "Connect Wallet"}
    </button>
  )
}
