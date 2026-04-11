import { Link } from "react-router-dom";
import { useFirebaseAuth } from "../../../hooks/useFirebaseAuth";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../../../contexts/AuthContext";
import { useState } from "react";
import { Shield, HelpCircle, BookOpen, LogOut, X, Loader2 } from "lucide-react";
import { useWalletState } from "@/hooks/useWalletState";
import { toast } from "sonner";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const MobileMenu = ({ isOpen, onClose }: MobileMenuProps) => {
  const { signout } = useFirebaseAuth();
  const { user } = useAuthContext();
  const navigate = useNavigate();
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

  const handleSignIn = () => {
    navigate("/sign-in");
    onClose();
  };

  const menuItems = [
    { to: "/explore", label: "Explore" },
    { to: "/book-clubs", label: "Book Clubs" },
  ];

  const userMenuItems = [
    { icon: Shield, label: "Privacy Policy", to: "/privacy-policy" },
    { icon: HelpCircle, label: "Help & Support", to: "/help" },
    { icon: BookOpen, label: "My Shelf", to: "/user-stories" },
  ];

  return (
    <div
      className={`lg:hidden fixed inset-0 z-50 bg-ns-bg transition-transform duration-300 ease-ns-spring ${
        isOpen ? "translate-x-0" : "translate-x-full"
      }`}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-ns-border">
          <h2 className="text-xl font-heading font-semibold text-ns-accent">
            Menu
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-ns-ink-secondary hover:text-ns-ink hover:bg-ns-surface rounded-ns transition-colors"
            aria-label="Close menu"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Navigation Links */}
          <div className="space-y-1 mb-6">
            {menuItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={onClose}
                className="block px-4 py-3 text-lg font-body text-ns-ink hover:bg-ns-surface rounded-ns transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* User Section */}
          {user ? (
            <>
              <div className="mb-4 pb-4 border-b border-ns-border">
                <div className="flex items-center gap-3 px-4 py-2">
                  {user.photoURL && user.photoURL.trim() !== "" ? (
                    <img
                      src={user.photoURL}
                      alt="User Avatar"
                      className="w-10 h-10 rounded-full border-2 border-ns-border"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-ns-accent flex items-center justify-center">
                      <span className="text-white font-semibold font-ui">
                        {user.displayName?.[0]?.toUpperCase() || "U"}
                      </span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate text-ns-ink">
                      {user.displayName || "User"}
                    </p>
                    <p className="text-xs text-ns-ink-muted truncate">
                      {user.email}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-1 mb-6">
                {userMenuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={onClose}
                      className="flex items-center gap-3 px-4 py-3 text-ns-ink hover:bg-ns-surface rounded-ns transition-colors"
                    >
                      <Icon className="w-5 h-5 text-ns-ink-muted" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>

              <button
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="flex items-center gap-3 w-full px-4 py-3 text-ns-destructive hover:bg-ns-destructive/5 rounded-ns transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSigningOut ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Signing out...</span>
                  </>
                ) : (
                  <>
                    <LogOut className="w-5 h-5" />
                    <span>Sign Out</span>
                  </>
                )}
              </button>
            </>
          ) : (
            <button
              onClick={handleSignIn}
              className="w-full px-4 py-3 bg-ns-accent hover:bg-ns-accent-hover text-white font-semibold font-ui rounded-ns transition-colors"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MobileMenu;
