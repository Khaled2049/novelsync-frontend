import React, { useEffect } from "react";
import { TransactionStatus as TxStatus } from "@/types/tipping";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Loader, CheckCircle2, XCircle, ExternalLink } from "lucide-react";

interface TransactionStatusProps {
  status: TxStatus;
  txHash?: string;
  error?: string | null;
  isOpen: boolean;
  onClose: () => void;
}

const getExplorerUrl = (txHash: string) => {
  const chainId = import.meta.env.VITE_CHAIN_ID || "11155111";
  if (chainId === "11155111") {
    return `https://sepolia.etherscan.io/tx/${txHash}`;
  }
  return `https://etherscan.io/tx/${txHash}`;
};

export const TransactionStatus: React.FC<TransactionStatusProps> = ({
  status,
  txHash,
  error,
  isOpen,
  onClose,
}) => {
  // Auto-close on success after 3 seconds
  useEffect(() => {
    if (status === TxStatus.SUCCESS && isOpen) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [status, isOpen, onClose]);

  if (!isOpen) return null;

  const getStatusContent = () => {
    switch (status) {
      case TxStatus.PENDING:
        return {
          icon: <Loader className="w-8 h-8 animate-spin text-blue-500" />,
          title: "Transaction Pending",
          message: "Your transaction is being submitted to the network...",
          color: "text-blue-500",
        };
      case TxStatus.CONFIRMING:
        return {
          icon: <Loader className="w-8 h-8 animate-spin text-yellow-500" />,
          title: "Confirming Transaction",
          message: "Waiting for blockchain confirmation...",
          color: "text-yellow-500",
        };
      case TxStatus.SUCCESS:
        return {
          icon: <CheckCircle2 className="w-8 h-8 text-emerald-500" />,
          title: "Transaction Successful!",
          message: "Your tip has been sent successfully.",
          color: "text-emerald-500",
        };
      case TxStatus.ERROR:
        return {
          icon: <XCircle className="w-8 h-8 text-red-500" />,
          title: "Transaction Failed",
          message:
            error || "An error occurred while processing your transaction.",
          color: "text-red-500",
        };
      default:
        return null;
    }
  };

  const content = getStatusContent();
  if (!content) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">{content.title}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center py-6 space-y-4">
          <div className={content.color}>{content.icon}</div>
          <p className="text-sm text-center text-black/70 dark:text-white/70">
            {content.message}
          </p>
          {txHash && (
            <a
              href={getExplorerUrl(txHash)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
            >
              View on Explorer
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
          {status === TxStatus.SUCCESS && (
            <button
              onClick={onClose}
              className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Close
            </button>
          )}
          {status === TxStatus.ERROR && (
            <button
              onClick={onClose}
              className="mt-4 px-4 py-2 bg-neutral-200 hover:bg-neutral-300 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-black dark:text-white rounded-lg text-sm font-medium transition-colors"
            >
              Close
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
