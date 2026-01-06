import { Link } from "react-router-dom";
import { useFirebaseAuth } from "../../hooks/useFirebaseAuth";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../../contexts/AuthContext";
import {
  Settings,
  Shield,
  HelpCircle,
  BookOpen,
  LogOut,
  X,
} from "lucide-react";
import { WalletConnectButton } from "../WalletConnectButton";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const MobileMenu = ({ isOpen, onClose }: MobileMenuProps) => {
  const { signout } = useFirebaseAuth();
  const { user } = useAuthContext();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signout();
    navigate("/sign-in");
    onClose();
  };

  const handleSignIn = () => {
    navigate("/sign-in");
    onClose();
  };

  const menuItems = [
    { to: "/home", label: "Home" },
    { to: "/explore", label: "Explore" },
    { to: "/book-clubs", label: "Book Clubs" },
  ];

  const userMenuItems = [
    { icon: Settings, label: "Settings", to: "/settings" },
    { icon: Shield, label: "Privacy Policy", to: "/privacy-policy" },
    { icon: HelpCircle, label: "Help & Support", to: "/help" },
    { icon: BookOpen, label: "My Stories", to: "/user-stories" },
  ];

  return (
    <div
      className={`lg:hidden fixed inset-0 z-50 bg-white dark:bg-black transition-transform duration-300 ease-in-out ${
        isOpen ? "translate-x-0" : "translate-x-full"
      }`}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-black/10 dark:border-white/10">
          <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-dark-green to-light-green dark:from-light-green dark:to-dark-green">
            Menu
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-black dark:text-white hover:bg-black/10 dark:hover:bg-white/10 rounded-md transition-colors"
            aria-label="Close menu"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Theme Toggle & Wallet */}
          <div className="flex items-center justify-between mb-6 pb-6 border-b border-black/10 dark:border-white/10">
            <div className="flex-1 ml-4">
              <WalletConnectButton />
            </div>
          </div>

          {/* Navigation Links */}
          <div className="space-y-2 mb-6">
            {menuItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={onClose}
                className="block px-4 py-3 text-lg text-black dark:text-white hover:bg-dark-green/10 dark:hover:bg-light-green/10 rounded-md transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* User Section */}
          {user ? (
            <>
              <div className="mb-4 pb-4 border-b border-black/10 dark:border-white/10">
                <div className="flex items-center gap-3 px-4 py-2">
                  {user.photoURL && user.photoURL.trim() !== "" ? (
                    <img
                      src={user.photoURL}
                      alt="User Avatar"
                      className="w-10 h-10 rounded-full border-2 border-dark-green dark:border-light-green"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-dark-green dark:bg-light-green flex items-center justify-center">
                      <span className="text-white dark:text-black font-semibold">
                        {user.displayName?.[0]?.toUpperCase() || "U"}
                      </span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate text-black dark:text-white">
                      {user.displayName || "User"}
                    </p>
                    <p className="text-xs text-black/60 dark:text-white/60 truncate">
                      {user.email}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2 mb-6">
                {userMenuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={onClose}
                      className="flex items-center gap-3 px-4 py-3 text-black dark:text-white hover:bg-dark-green/10 dark:hover:bg-light-green/10 rounded-md transition-colors"
                    >
                      <Icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>

              <button
                onClick={handleSignOut}
                className="flex items-center gap-3 w-full px-4 py-3 text-red-500 hover:bg-red-500/10 rounded-md transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span>Sign Out</span>
              </button>
            </>
          ) : (
            <button
              onClick={handleSignIn}
              className="w-full px-4 py-3 bg-dark-green dark:bg-light-green hover:bg-light-green dark:hover:bg-dark-green text-white font-semibold rounded-md transition-colors"
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
