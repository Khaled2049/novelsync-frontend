export enum TransactionStatus {
  IDLE = "idle",
  PENDING = "pending",
  CONFIRMING = "confirming",
  SUCCESS = "success",
  ERROR = "error",
}

export interface FeeSplit {
  authorAmount: string;
  platformFee: string;
  totalAmount: string;
}

export interface TokenBalance {
  eth: string;
  usdc: string;
  isLoading: boolean;
}

export interface TipTransaction {
  txHash: string;
  from: string;
  to: string;
  amount: string;
  token: string; // address(0) for ETH
  timestamp: number;
  status: TransactionStatus;
}

export interface TipHistory {
  userTips: TipTransaction[];
  authorTips: TipTransaction[];
  allTips: TipTransaction[];
  isLoading: boolean;
}
