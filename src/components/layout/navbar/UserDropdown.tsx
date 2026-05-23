import { Link } from "react-router-dom";
import { useRef, useEffect, RefObject, useState } from "react";
import { useFirebaseAuth } from "../../../hooks/useFirebaseAuth";
import { useNavigate } from "react-router-dom";
import { useWalletState } from "@/hooks/useWalletState";
import { toast } from "sonner";

import {
  User,
  Shield,
  HelpCircle,
  BookOpen,
  LogOut,
  Loader2,
} from "lucide-react";
import { IUser } from "../../../types/IUser";
import { ThemeToggle } from "@/components/common/ThemeToggle";

interface UserDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  user: IUser | null;
  containerRef?: RefObject<HTMLDivElement | null>;
}

const UserDropdown = ({
  isOpen,
  onClose,
  user,
  containerRef,
}: UserDropdownProps) => {
  const { signout } = useFirebaseAuth();
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { address, disconnectWallet } = useWalletState();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    if (isSigningOut) return;

    setIsSigningOut(true);
    try {
      // Best effort: disconnect wallet before Firebase sign-out.
      if (address) {
        try {
          await disconnectWallet();
        } catch (disconnectError) {
          console.warn(
            "Wallet disconnect failed during sign-out:",
            disconnectError,
          );
        }
      }

      await signout();
      onClose();
      navigate("/sign-in");
      toast.success("Signed out successfully");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to sign out";
      toast.error(message);
    } finally {
      setIsSigningOut(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(target) &&
        containerRef?.current &&
        !containerRef.current.contains(target)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      const timeoutId = setTimeout(() => {
        document.addEventListener("click", handleClickOutside);
      }, 0);

      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener("click", handleClickOutside);
      };
    }

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [isOpen, onClose, containerRef]);

  if (!isOpen || !user) return null;

  const menuItems = [
    {
      icon: Shield,
      label: "Privacy Policy",
      to: "/privacy-policy",
      onClick: onClose,
    },
    {
      icon: HelpCircle,
      label: "Help & Support",
      to: "/help",
      onClick: onClose,
    },
    {
      icon: BookOpen,
      label: "My Shelf",
      to: "/user-stories",
      onClick: onClose,
    },
  ];

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 mt-2 w-56 bg-ns-elevated text-ns-ink rounded-ns-xl shadow-ns-lg z-50 overflow-hidden border border-ns-border animate-ns-slide-down"
    >
      {/* User Info */}
      <div className="flex items-center border-b border-ns-border">
        <Link
          to="/profile"
          onClick={onClose}
          className="flex-1 p-4 hover:bg-ns-surface transition-colors"
        >
          <div className="flex items-center gap-3">
            {user.photoURL && user.photoURL.trim() !== "" ? (
              <img
                src={user.photoURL}
                alt="User Avatar"
                className="w-10 h-10 rounded-full border-2 border-ns-border"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-ns-accent flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate text-ns-ink">
                {user.displayName || "User"}
              </p>
              <p className="text-xs text-ns-ink-muted truncate">{user.email}</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Menu Items */}
      <div className="py-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={item.onClick}
              className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-ns-surface transition-colors group"
            >
              <Icon className="w-4 h-4 text-ns-ink-muted group-hover:text-ns-accent transition-colors" />
              <span className="text-ns-ink-secondary group-hover:text-ns-ink transition-colors">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Sign Out */}
      <div className="border-t border-ns-border">
        <button
          onClick={handleSignOut}
          disabled={isSigningOut}
          className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-ns-destructive hover:bg-ns-destructive/5 transition-colors group disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSigningOut ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Signing out...</span>
            </>
          ) : (
            <>
              <LogOut className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span>Sign Out</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default UserDropdown;
