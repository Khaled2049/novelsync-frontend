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
  ArrowRight,
} from "lucide-react";
import { IUser } from "../../../types/IUser";

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
      icon: BookOpen,
      label: "My Shelf",
      to: "/user-stories",
      onClick: onClose,
    },
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
  ];

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 mt-2 w-64 bg-ns-elevated text-ns-ink rounded-ns-xl shadow-ns-lg z-50 overflow-hidden border border-ns-border animate-ns-slide-down"
    >
      {/* User Info — editorial header with accent-tinted band */}
      <Link
        to="/profile"
        onClick={onClose}
        className="group/header relative block border-b border-ns-border bg-gradient-to-br from-ns-accent-subtle to-ns-surface px-4 pt-5 pb-4 transition-colors"
      >
        <div className="flex items-center gap-3">
          {user.photoURL && user.photoURL.trim() !== "" ? (
            <img
              src={user.photoURL}
              alt="User Avatar"
              className="w-12 h-12 rounded-full border-2 border-ns-elevated shadow-ns-sm object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-ns-accent border-2 border-ns-elevated shadow-ns-sm flex items-center justify-center flex-shrink-0">
              <User className="w-6 h-6 text-white" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-ui text-sm font-semibold truncate text-ns-ink">
              {user.displayName || "User"}
            </p>
            <p className="font-ui text-xs text-ns-ink-muted truncate">
              {user.email}
            </p>
          </div>
        </div>
        <span className="mt-3 inline-flex items-center gap-1 font-ui text-[11px] font-semibold uppercase tracking-wide text-ns-accent">
          View profile
          <ArrowRight className="w-3 h-3 transition-transform duration-200 group-hover/header:translate-x-0.5" />
        </span>
      </Link>

      {/* Menu Items */}
      <div className="py-1.5">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={item.onClick}
              className="group relative flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-ns-surface transition-colors"
            >
              {/* accent bar slides in on hover */}
              <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full bg-ns-accent scale-y-0 group-hover:scale-y-100 origin-center transition-transform duration-200" />
              <Icon className="w-4 h-4 text-ns-ink-muted group-hover:text-ns-accent transition-colors" />
              <span className="font-ui text-ns-ink-secondary group-hover:text-ns-ink transition-colors">
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
              <span className="font-ui">Signing out...</span>
            </>
          ) : (
            <>
              <LogOut className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span className="font-ui">Sign Out</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default UserDropdown;
