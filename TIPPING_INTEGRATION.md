# TippingPlatform Integration Guide

This document describes the blockchain tipping integration using Thirdweb SDK.

## Overview

The tipping system allows users to tip authors using either native ETH or USDC tokens on the Sepolia testnet. The integration includes wallet connectivity, transaction management, and fee preview functionality.

## Setup

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
TIPPING_CONTRACT_ADDRESS=0x...  # Your deployed TippingPlatform contract address
USDC_TOKEN_ADDRESS=0x...         # USDC token address on Sepolia
CHAIN_ID=11155111                # Sepolia chain ID
THIRDWEB_CLIENT_ID=your_client_id_here  # Optional: Thirdweb client ID
```

### Dependencies

The following packages have been installed:

- `@thirdweb-dev/react` - React hooks and components
- `@thirdweb-dev/sdk` - Core SDK
- `ethers` - Ethereum library

## Architecture

### Components

1. **Web3Provider** (`src/contexts/Web3Provider.tsx`)

   - Wraps the app with ThirdwebProvider
   - Configures Sepolia testnet
   - Must be at the top level of the provider tree

2. **WalletConnectButton** (`src/components/WalletConnectButton.tsx`)

   - Displays wallet connection status
   - Shows truncated address when connected
   - Network indicator for Sepolia

3. **StoryTipModal** (`src/routes/Story/components/StoryTipModal.tsx`)

   - Main tipping interface
   - Supports ETH and USDC payments
   - Includes fee preview and transaction status

4. **FeePreviewCard** (`src/components/FeePreviewCard.tsx`)

   - Displays fee breakdown before transaction
   - Shows author amount and platform fee

5. **TransactionStatus** (`src/components/TransactionStatus.tsx`)
   - Shows transaction progress
   - Displays success/error states
   - Links to blockchain explorer

### Hooks

1. **useTippingContract** (`src/hooks/useTippingContract.ts`)

   - Main contract interaction hook
   - Functions: `tipAuthorWithETH`, `tipAuthorWithUSDC`, `calculateSplit`
   - Manages transaction states

2. **useUSDCApproval** (`src/hooks/useUSDCApproval.ts`)

   - Handles ERC20 token approval
   - Checks current allowance
   - Manages approval transactions

3. **useTokenBalance** (`src/hooks/useTokenBalance.ts`)

   - Gets user's ETH and USDC balances
   - Refreshes on demand

4. **useTransactionHistory** (`src/hooks/useTransactionHistory.ts`)
   - Listens to TipSent events
   - Filters by user or author address
   - Returns transaction history

## Usage Flow

1. **Connect Wallet**

   - User clicks "Connect Wallet" button in Navbar
   - Thirdweb modal opens for wallet selection
   - User connects MetaMask, WalletConnect, etc.

2. **Select Payment Method**

   - User opens tip modal from author bio
   - Chooses ETH or USDC payment method
   - Views current balance

3. **Enter Amount**

   - Selects preset amount or enters custom amount
   - Fee preview updates in real-time
   - Validates minimum tip amount

4. **Approve (USDC only)**

   - If using USDC, approval may be required
   - User approves token spending
   - Approval transaction is processed

5. **Send Tip**
   - User clicks "Send Tip" button
   - Transaction is submitted to blockchain
   - Status modal shows progress
   - Success/error feedback displayed

## Error Handling

The integration includes comprehensive error handling for:

- Wallet not connected
- Wrong network (prompts to switch)
- Insufficient balance
- Transaction rejection
- Network errors
- Approval failures

## Testing

To test the integration:

1. Ensure contract is deployed on Sepolia
2. Set environment variables
3. Start the development server: `yarn dev`
4. Connect a wallet with Sepolia testnet
5. Navigate to a story page
6. Click "Support this author" button
7. Test tipping with ETH and USDC

## Notes

- USDC on Sepolia: You may need to deploy a mock USDC token or use a testnet USDC
- Gas fees: Users need ETH for gas even when tipping with USDC
- Minimum tip: Enforced by the smart contract
- Platform fee: Configurable by contract owner, displayed in fee preview

## Future Enhancements

- Transaction history page
- Gas estimation display
- Multi-token support UI
- Toast notifications
- Error boundaries for Web3 errors
